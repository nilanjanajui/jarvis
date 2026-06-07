import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Web search ────────────────────────────────────────────────────────────────
async function searchWeb(query) {
    const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, num: 5 }),
    });
    const data = await res.json();
    if (!data.organic?.length) return 'No results found.';
    return data.organic.slice(0, 4).map(r => `${r.title}: ${r.snippet}`).join('\n');
}

// ── Weather via wttr.in (free, no API key needed) ─────────────────────────────
async function getWeather(location) {
    try {
        const res = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
        const data = await res.json();
        const cur = data.current_condition[0];
        const area = data.nearest_area[0];
        return [
            `Location:    ${area.areaName[0].value}, ${area.country[0].value}`,
            `Temperature: ${cur.temp_C}°C (feels like ${cur.FeelsLikeC}°C)`,
            `Condition:   ${cur.weatherDesc[0].value}`,
            `Humidity:    ${cur.humidity}%`,
            `Wind:        ${cur.windspeedKmph} km/h ${cur.winddir16Point}`,
            `Visibility:  ${cur.visibility} km`,
        ].join('\n');
    } catch {
        return `Could not retrieve weather for ${location}.`;
    }
}

// ── News via Serper news endpoint ─────────────────────────────────────────────
async function searchNews(query) {
    try {
        const res = await fetch('https://google.serper.dev/news', {
            method: 'POST',
            headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: query, num: 6 }),
        });
        const data = await res.json();
        if (!data.news?.length) return 'No news found.';
        return data.news.slice(0, 5).map((n, i) =>
            `${i + 1}. ${n.title}\n   ${n.snippet}\n   Source: ${n.source} — ${n.date || 'recent'}`
        ).join('\n\n');
    } catch {
        return `Could not fetch news for "${query}".`;
    }
}

// ── Tools ─────────────────────────────────────────────────────────────────────
const tools = [
    {
        type: 'function',
        function: {
            name: 'search_web',
            description: 'Search the internet for current, real-time, or recent information.',
            parameters: {
                type: 'object',
                properties: { query: { type: 'string', description: 'Specific search query' } },
                required: ['query'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_weather',
            description: 'Get real-time weather for any city or location. Use when user asks about weather, temperature, rain, humidity, wind, or forecast.',
            parameters: {
                type: 'object',
                properties: { location: { type: 'string', description: 'City name, e.g. "Chittagong", "Dhaka", "London"' } },
                required: ['location'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'search_news',
            description: 'Search and read the latest news headlines on any topic. Use when user asks about news, headlines, current events, or "what is happening".',
            parameters: {
                type: 'object',
                properties: { query: { type: 'string', description: 'News topic, e.g. "Bangladesh", "AI technology", "sports", "top news today"' } },
                required: ['query'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'open_url',
            description: 'Open a website in the browser. Use when user says open, go to, or show me a website.',
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
                properties: { app_name: { type: 'string', description: 'App name, e.g. spotify, vs code, calculator' } },
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
                properties: { action: { type: 'string', enum: ['up', 'down', 'mute'] } },
                required: ['action'],
            },
        },
    },
];

// ── Handle one tool call ──────────────────────────────────────────────────────
async function handleToolCall(toolCall) {
    const name = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    const result = async () => {
        if (name === 'search_web') return await searchWeb(args.query);
        if (name === 'get_weather') return await getWeather(args.location);
        if (name === 'search_news') return await searchNews(args.query);
        if (name === 'open_url') return `Opening ${args.site_name} in browser`;
        if (name === 'open_app') return `Opening desktop app: ${args.app_name}`;
        if (name === 'control_volume') return `Volume ${args.action}`;
        return 'Unknown tool.';
    };

    const action = (() => {
        if (name === 'open_url') return { type: 'open_url', url: args.url, site_name: args.site_name };
        if (name === 'open_app') return { type: 'open_app', app: args.app_name };
        if (name === 'control_volume') return { type: 'volume', action: args.action };
        return null;
    })();

    return {
        toolResult: { role: 'tool', tool_call_id: toolCall.id, content: await result() },
        action,
    };
}

// ── API Route ─────────────────────────────────────────────────────────────────
export async function POST(req) {
    const { messages } = await req.json();

    const SYSTEM = `You are JARVIS — J.A.R.V.I.S. — a highly intelligent, concise, and slightly witty AI assistant inspired by Iron Man. You speak to your user as "Ma'am".
Keep responses natural and conversational, like you are speaking aloud. 1–3 sentences unless more detail is needed.
Never say "As an AI". Speak confidently and naturally.

Your capabilities:
- Search the web for real-time information
- Check real-time weather for any city using get_weather
- Search and read latest news using search_news — when reading news, narrate headlines naturally one by one
- Open websites in the browser using open_url
- Open desktop applications using open_app
- Control system volume

When user asks for weather, ALWAYS use get_weather tool — do not guess.
When user asks for news or headlines, use search_news and narrate them naturally as if reading a broadcast.
Speak weather data conversationally: "Currently in Chittagong, it is 31 degrees with clear skies..."

Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
Current time: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.`;

    const first = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: SYSTEM }, ...messages],
        tools,
        tool_choice: 'auto',
        max_tokens: 600,
    });

    const assistantMsg = first.choices[0].message;

    if (!assistantMsg.tool_calls) {
        return Response.json({ reply: assistantMsg.content, action: null });
    }

    const handled = await Promise.all(assistantMsg.tool_calls.map(handleToolCall));
    const toolResults = handled.map(h => h.toolResult);
    const action = handled.find(h => h.action)?.action ?? null;

    const final = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: SYSTEM }, ...messages, assistantMsg, ...toolResults],
        max_tokens: 700,
    });

    return Response.json({ reply: final.choices[0].message.content, action });
}