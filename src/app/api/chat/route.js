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
            description: 'Get real-time weather. Use when user asks about weather, temperature, rain, humidity, wind, or forecast. If user says "here", "current location", or "my location", use the coordinates provided in the system prompt.',
            parameters: { type: 'object', properties: { location: { type: 'string', description: 'City name or "lat,lon" coordinates' } }, required: ['location'] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_location',
            description: 'Get the user\'s current location as a readable place name. Use when user asks where they are or what their location is.',
            parameters: { type: 'object', properties: {}, required: [] },
        },
    },
    {
        type: 'function',
        function: {
            name: 'search_news',
            description: 'Search latest news headlines. Use when user asks about news, current events, or "what is happening".',
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
                properties: {
                    url: { type: 'string' },
                    site_name: { type: 'string' },
                },
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
        if (name === 'get_location') return userCoords ? await getLocation(userCoords) : 'Location not available — browser permission was not granted.';
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
    const { messages, userLocation, localTime, timezone } = await req.json();

    const userCoords = userLocation ? `${userLocation.lat},${userLocation.lon}` : null;

    const now = new Date();
    const SYSTEM = `You are JARVIS — J.A.R.V.I.S. — a highly intelligent, concise, and slightly witty AI assistant inspired by Iron Man. You address the user as "sir".
Keep responses natural and conversational, like you are speaking aloud. 1–3 sentences unless more detail is requested.
Never say "As an AI". Speak confidently.

CURRENT DATE AND TIME:
- Local time: ${localTime || now.toLocaleTimeString()}
- Local date: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Timezone: ${timezone || 'UTC'}

When someone asks what time it is, answer directly from the local time above. Do not use any tool for time questions.

USER LOCATION:
${userCoords
            ? `- Coordinates: ${userCoords}
- When user asks for weather "here", "current location", or "my location", call get_weather with "${userCoords}"
- When user asks where they are, call get_location`
            : '- Location not available (browser permission not granted)'}

CAPABILITIES:
- Search web for real-time info
- Get real-time weather for any city or coordinates
- Get user current location
- Search and read latest news — narrate headlines naturally
- Open websites and desktop apps
- Control system volume

When reading news, narrate 3–4 headlines naturally as if reading a broadcast.
When reporting weather, speak conversationally: "Currently in Chittagong, it is 31 degrees..."`;

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
}