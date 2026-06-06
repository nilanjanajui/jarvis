import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function searchWeb(query) {
    const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
            'X-API-KEY': process.env.SERPER_API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: 5 }),
    });
    const data = await res.json();
    if (!data.organic?.length) return 'No results found.';
    return data.organic.slice(0, 4).map((r) => `${r.title}: ${r.snippet}`).join('\n');
}

const tools = [
    {
        type: 'function',
        function: {
            name: 'search_web',
            description: 'Search the internet for current or real-time information — news, weather, prices, sports scores, anything that changes often.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Specific search query' },
                },
                required: ['query'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'open_url',
            description: 'Open a website in the browser. Use when user says open, go to, or show me a website like YouTube, GitHub, Gmail.',
            parameters: {
                type: 'object',
                properties: {
                    url: { type: 'string', description: 'Full URL, e.g. https://youtube.com' },
                    site_name: { type: 'string', description: 'Human name of site, e.g. YouTube' },
                },
                required: ['url', 'site_name'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'open_app',
            description: 'Open a desktop application. Use when user says open, launch, or start an app like Spotify, VS Code, Calculator.',
            parameters: {
                type: 'object',
                properties: {
                    app_name: { type: 'string', description: 'App name, e.g. spotify, vs code, calculator' },
                },
                required: ['app_name'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'control_volume',
            description: 'Control system volume. Use when user says turn up/down the volume or mute.',
            parameters: {
                type: 'object',
                properties: {
                    action: { type: 'string', enum: ['up', 'down', 'mute'] },
                },
                required: ['action'],
            },
        },
    },
];

async function handleToolCall(toolCall) {
    const name = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    if (name === 'search_web') {
        const result = await searchWeb(args.query);
        return {
            toolResult: { role: 'tool', tool_call_id: toolCall.id, content: result },
            action: null,
        };
    }
    if (name === 'open_url') {
        return {
            toolResult: { role: 'tool', tool_call_id: toolCall.id, content: `Opening ${args.site_name} in browser` },
            action: { type: 'open_url', url: args.url, site_name: args.site_name },
        };
    }
    if (name === 'open_app') {
        return {
            toolResult: { role: 'tool', tool_call_id: toolCall.id, content: `Opening desktop app: ${args.app_name}` },
            action: { type: 'open_app', app: args.app_name },
        };
    }
    if (name === 'control_volume') {
        return {
            toolResult: { role: 'tool', tool_call_id: toolCall.id, content: `Volume ${args.action}` },
            action: { type: 'volume', action: args.action },
        };
    }
    return {
        toolResult: { role: 'tool', tool_call_id: toolCall.id, content: 'Unknown tool.' },
        action: null,
    };
}

export async function POST(req) {
    const { messages } = await req.json();

    const SYSTEM = `You are JARVIS — intelligent, concise, slightly witty. Inspired by Iron Man.
Give direct answers in 1–2 sentences unless more detail is asked for.
Never say "As an AI". Speak naturally and confidently.
You can search the web, open websites, open desktop apps, and control volume.
When user says "open [something]" — use open_url for websites, open_app for desktop software.
Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;

    const first = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: SYSTEM }, ...messages],
        tools,
        tool_choice: 'auto',
        max_tokens: 400,
    });

    const assistantMsg = first.choices[0].message;

    if (!assistantMsg.tool_calls) {
        return Response.json({ reply: assistantMsg.content, action: null });
    }

    const handled = await Promise.all(assistantMsg.tool_calls.map(handleToolCall));
    const toolResults = handled.map((h) => h.toolResult);
    const action = handled.find((h) => h.action)?.action ?? null;

    const final = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: SYSTEM }, ...messages, assistantMsg, ...toolResults],
        max_tokens: 400,
    });

    return Response.json({ reply: final.choices[0].message.content, action });
}