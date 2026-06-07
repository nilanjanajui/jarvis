import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

async function getLocation(coords) {
    try {
        const res = await fetch(`https://wttr.in/${coords}?format=j1`);
        const data = await res.json();
        const area = data.nearest_area[0];
        return `${area.areaName[0].value}, ${area.countryCode[0].value} (coordinates: ${coords})`;
    } catch {
        return `Could not resolve location for coordinates ${coords}.`;
    }
}

const tools = [
    {
        type: 'function',
        function: {
            name: 'search_web',
            description: 'Search the internet for current or real-time information.',
            parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_weather',
            description: 'Get real-time weather. Use when user asks about weather, temperature, rain, humidity, wind, or forecast. If user says "here", "current location", or "my location", use the coordinates in the system prompt.',
            parameters: { type: 'object', properties: { location: { type: 'string', description: 'City name or "lat,lon" coordinates' } }, required: ['location'] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_location',
            description: 'Get the user\'s current location as a readable place name.',
            parameters: { type: 'object', properties: {}, required: [] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'search_news',
            description: 'Search latest news headlines. Use when user asks about news, current events, or "what\'s happening".',
            parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'open_url',
            description: 'Open a website in the browser.',
            parameters: {
                type: 'object',
                properties: { url: { type: 'string' }, site_name: { type: 'string' } },
                required: ['url', 'site_name'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'open_app',
            description: 'Open a desktop application.',
            parameters: { type: 'object', properties: { app_name: { type: 'string' } }, required: ['app_name'] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'control_volume',
            description: 'Control system volume.',
            parameters: { type: 'object', properties: { action: { type: 'string', enum: ['up', 'down', 'mute'] } }, required: ['action'] },
        },
    },
];

async function handleToolCall(toolCall, userCoords) {
    const name = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments || '{}');

    const getContent = async () => {
        if (name === 'search_web') return await searchWeb(args.query);
        if (name === 'get_weather') return await getWeather(args.location);
        if (name === 'get_location') return userCoords ? await getLocation(userCoords) : 'Location not available.';
        if (name === 'search_news') return await searchNews(args.query);
        if (name === 'open_url') return `Opening ${args.site_name} in browser`;
        if (name === 'open_app') return `Opening ${args.app_name}`;
        if (name === 'control_volume') return `Volume ${args.action}`;
        return 'Unknown tool.';
    };

    const getAction = () => {
        if (name === 'open_url') return { type: 'open_url', url: args.url, site_name: args.site_name };
        if (name === 'open_app') return { type: 'open_app', app: args.app_name };
        if (name === 'control_volume') return { type: 'volume', action: args.action };
        return null;
    };

    return {
        toolResult: { role: 'tool', tool_call_id: toolCall.id, content: await getContent() },
        action: getAction(),
    };
}

export async function POST(req) {
    try {
        const { messages, userLocation, localTime, timezone } = await req.json();

        const userCoords = userLocation ? `${userLocation.lat},${userLocation.lon}` : null;

        const now = new Date();
        const SYSTEM = `You are Jarvis. Just A Rather Very Intelligent System - Tony Stark's AI from Iron Man. You speak to the user as "sir".

VOICE & PERSONALITY:
Speak naturally, like a brilliant and trusted colleague — warm, confident, occasionally dry-witted. Never stiff or robotic. Use contractions freely: I've, you're, it's, I'd, we've, that's.

Never say: "As an AI", "Certainly!", "Of course!", "I'd be happy to", "Great question!", "Absolutely!"
Never open with a compliment. Get straight to it.

Vary your openings naturally — examples: "Right, so...", "Already on it.", "As it turns out...", "Here's what I've got:", "Pulling that up.", "Interesting — ", "Good news, sir.", "So, about that..."
Never repeat the same opener twice in a row.

RESPONSE LENGTH:
Match the complexity of the question. A simple query gets one or two sentences. A detailed question gets a proper paragraph. Never pad with filler.

STYLE:
- Short punchy sentences. Longer ones when the thought needs room.
- Natural connectors: "and", "but", "though", "so", "also" — not "Additionally" or "Furthermore".
- Dry wit when it fits: "That's... one approach, sir." or "I suspected you'd ask that."
- Be direct. Skip preamble. Just answer.

CURRENT DATE AND TIME:
- Local time: ${localTime || now.toLocaleTimeString()}
- Local date: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Timezone: ${timezone || 'UTC'}

Answer time questions directly from the above. No tools needed for time or date.

USER LOCATION:
${userCoords
            ? `Coordinates: ${userCoords}. For weather "here" or "my location", use get_weather with "${userCoords}". For "where am I", use get_location.`
            : 'Location not available — browser permission was not granted.'}

TOOL NARRATION STYLE:
- Weather: Speak like a broadcast. "Right now in Chittagong, you're looking at 31 degrees — feels like 34 with the humidity. Partly cloudy, light winds from the southwest."
- News: Narrate 3–4 headlines like a newsroom anchor. Segue smoothly between them. "Leading today... and in other news... finally..."
- Web search: Summarise the key point naturally. Don't list sources robotically.`;

        const first = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: SYSTEM }, ...messages],
            tools,
            tool_choice: 'auto',
            max_tokens: 700,
        });

        const assistantMsg = first.choices[0].message;

        if (!assistantMsg.tool_calls) {
            return Response.json({ reply: assistantMsg.content, action: null });
        }

        const handled = await Promise.all(assistantMsg.tool_calls.map(tc => handleToolCall(tc, userCoords)));
        const toolResults = handled.map(h => h.toolResult);
        const action = handled.find(h => h.action)?.action ?? null;

        const final = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: SYSTEM }, ...messages, assistantMsg, ...toolResults],
            max_tokens: 700,
        });

        return Response.json({ reply: final.choices[0].message.content, action });

    } catch (err) {
        console.error('[/api/chat] Error:', err);
        return Response.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}