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

    {
        type: 'function',
        function: {
            name: 'calculate',
            description: 'Perform a mathematical calculation. Use for any arithmetic, percentages, or math expressions like "847 times 23" or "15% of 200".',
            parameters: {
                type: 'object',
                properties: { expression: { type: 'string', description: 'Math expression, e.g. "847*23" or "200*0.15"' } },
                required: ['expression'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'search_wikipedia',
            description: 'Look up factual information about a topic, person, place, or thing on Wikipedia. Use for general knowledge questions.',
            parameters: {
                type: 'object',
                properties: { query: { type: 'string', description: 'Topic to look up, e.g. "Albert Einstein", "Bangladesh"' } },
                required: ['query'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'set_timer',
            description: 'Set a countdown timer. Use when user says "set a timer for X minutes/seconds".',
            parameters: {
                type: 'object',
                properties: {
                    seconds: { type: 'number', description: 'Duration in seconds, e.g. 600 for 10 minutes' },
                    label: { type: 'string', description: 'What the timer is for, e.g. "tea", "workout"' },
                },
                required: ['seconds'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'set_reminder',
            description: 'Set a reminder for later. Use when user says "remind me to X in Y minutes" or "remind me to X at [time]". Convert the target time to seconds from now.',
            parameters: {
                type: 'object',
                properties: {
                    seconds: { type: 'number', description: 'Seconds from now when the reminder should fire' },
                    message: { type: 'string', description: 'What to remind the user about' },
                },
                required: ['seconds', 'message'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'media_control',
            description: 'Control media playback on system (play_pause, next, previous, stop).',
            parameters: {
                type: 'object',
                properties: { action: { type: 'string', enum: ['play_pause', 'next', 'previous', 'stop'] } },
                required: ['action'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'execute_system_command',
            description: 'Execute a bash shell command on the local machine. Use when user asks to run CLI commands like "git status", "ls", "uptime", "df -h", "check disk space".',
            parameters: {
                type: 'object',
                properties: { command: { type: 'string', description: 'Terminal command to execute' } },
                required: ['command'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'remember_fact',
            description: 'Save a key user fact or preference to memory when user says "remember that..." or states a preference.',
            parameters: {
                type: 'object',
                properties: { fact: { type: 'string', description: 'The exact fact or preference' } },
                required: ['fact'],
            },
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
        if (name === 'calculate') return calculate(args.expression);
        if (name === 'search_wikipedia') return await searchWikipedia(args.query);
        if (name === 'set_timer') return `Timer set for ${args.seconds} seconds${args.label ? ' — ' + args.label : ''}`;
        if (name === 'set_reminder') return `Reminder set for ${args.seconds} seconds from now: ${args.message}`;
        if (name === 'open_url') return `Opening ${args.site_name} in browser`;
        if (name === 'open_app') return `Opening ${args.app_name}`;
        if (name === 'control_volume') return `Volume ${args.action}`;
        if (name === 'media_control') return `Media action executed: ${args.action}`;
        if (name === 'execute_system_command') return `Command prepared for approval: ${args.command}`;
        if (name === 'remember_fact') return `Fact retained in memory: ${args.fact}`;
        return 'Unknown tool.';
    };

    const getAction = () => {
        if (name === 'open_url') return { type: 'open_url', url: args.url, site_name: args.site_name };
        if (name === 'open_app') return { type: 'open_app', app: args.app_name };
        if (name === 'control_volume') return { type: 'volume', action: args.action };
        if (name === 'set_timer') return { type: 'timer', seconds: args.seconds, label: args.label || 'Timer' };
        if (name === 'set_reminder') return { type: 'reminder', seconds: args.seconds, message: args.message };
        if (name === 'media_control') return { type: 'media', action: args.action };
        if (name === 'execute_system_command') return { type: 'shell', command: args.command };
        if (name === 'remember_fact') return { type: 'remember', fact: args.fact };
        return null;
    };

    function calculate(expression) {
        try {
            // Only allow safe math characters — numbers, operators, parentheses, decimal points
            const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, '');
            if (!sanitized.trim()) return 'Invalid expression.';
            const result = Function(`"use strict"; return (${sanitized})`)();
            if (typeof result !== 'number' || !isFinite(result)) return 'Could not compute that.';
            return `${expression} = ${result}`;
        } catch {
            return 'Could not compute that expression.';
        }
    }

    async function searchWikipedia(query) {
        try {
            const res = await fetch(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
            );
            if (!res.ok) return `No Wikipedia article found for "${query}".`;
            const data = await res.json();
            return `${data.title}: ${data.extract}`;
        } catch {
            return `Could not fetch Wikipedia info for "${query}".`;
        }
    }

    return {
        toolResult: { role: 'tool', tool_call_id: toolCall.id, content: await getContent() },
        action: getAction(),
    };
}

function buildSystemPrompt(localTime, timezone, userCoords) {
    const now = new Date();
    return `You are Jarvis. Just A Rather Very Intelligent System - Tony Stark's AI from Iron Man. You speak to the user as "sir".

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
- News: Narrate 3-4 headlines like a newsroom anchor. Segue smoothly between them. "Leading today... and in other news... finally..."
- Web search: Summarise the key point naturally. Don't list sources robotically.
- Calculations: State the answer directly and naturally. "That comes out to 19,481, sir."
- Wikipedia: Summarise the key facts in 2-3 sentences, don't just repeat the raw extract verbatim.
- Timers/reminders: Confirm naturally. "Timer's set, sir - I'll let you know in ten minutes." Convert spoken durations like "10 minutes" to seconds yourself before calling the tool.`;
}

// Fallback model list for resilient Groq API calls
const MODELS = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
    'qwen/qwen3.6-27b',
    'groq/compound',
    'groq/compound-mini',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
];

async function createCompletionWithFallback(params) {
    let lastErr = null;
    for (const model of MODELS) {
        try {
            return await groq.chat.completions.create({ ...params, model });
        } catch (err) {
            lastErr = err;
            const isModelError =
                err?.status === 404 ||
                err?.status === 400 ||
                err?.code === 'model_not_found' ||
                err?.code === 'model_decommissioned' ||
                err?.error?.code === 'model_not_found' ||
                err?.error?.code === 'model_decommissioned' ||
                err?.message?.includes('decommissioned') ||
                err?.message?.includes('not exist');

            if (isModelError) {
                console.warn(`[Groq] Model "${model}" unavailable (${err.message}), trying next fallback...`);
                continue;
            }
            throw err;
        }
    }
    throw lastErr;
}

export async function POST(req) {
    const { messages, userLocation, localTime, timezone } = await req.json();
    const userCoords = userLocation ? `${userLocation.lat},${userLocation.lon}` : null;
    const SYSTEM = buildSystemPrompt(localTime, timezone, userCoords);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const send = (obj) => controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));

            try {
                // ── First streamed call — decides on tools while streaming any direct text ──
                const first = await createCompletionWithFallback({
                    messages: [{ role: 'system', content: SYSTEM }, ...messages],
                    tools,
                    tool_choice: 'auto',
                    stream: true,
                    max_tokens: 700,
                });

                let textAcc = '';
                let toolCallsAcc = {};
                let sawToolCall = false;

                for await (const chunk of first) {
                    const delta = chunk.choices?.[0]?.delta;
                    if (!delta) continue;

                    if (delta.content) {
                        textAcc += delta.content;
                        send({ type: 'delta', text: delta.content });
                    }

                    if (delta.tool_calls) {
                        sawToolCall = true;
                        for (const tc of delta.tool_calls) {
                            const idx = tc.index ?? 0;
                            if (!toolCallsAcc[idx]) toolCallsAcc[idx] = { id: '', name: '', arguments: '' };
                            if (tc.id) toolCallsAcc[idx].id = tc.id;
                            if (tc.function?.name) toolCallsAcc[idx].name += tc.function.name;
                            if (tc.function?.arguments) toolCallsAcc[idx].arguments += tc.function.arguments;
                        }
                    }
                }

                // No tools needed — the text above was already streamed live, we're done
                if (!sawToolCall) {
                    send({ type: 'action', action: null });
                    send({ type: 'done' });
                    controller.close();
                    return;
                }

                // ── Tools were called — execute them ──
                const toolCallsArray = Object.values(toolCallsAcc).map((tc) => ({
                    id: tc.id,
                    type: 'function',
                    function: { name: tc.name, arguments: tc.arguments },
                }));

                const assistantMsg = { role: 'assistant', content: textAcc || null, tool_calls: toolCallsArray };

                const handled = await Promise.all(toolCallsArray.map((tc) => handleToolCall(tc, userCoords)));
                const toolResults = handled.map((h) => h.toolResult);
                const action = handled.find((h) => h.action)?.action ?? null;

                send({ type: 'action', action });

                // ── Second streamed call — final narrated reply using tool results ──
                const final = await createCompletionWithFallback({
                    messages: [{ role: 'system', content: SYSTEM }, ...messages, assistantMsg, ...toolResults],
                    stream: true,
                    max_tokens: 700,
                });

                for await (const chunk of final) {
                    const delta = chunk.choices?.[0]?.delta;
                    if (delta?.content) send({ type: 'delta', text: delta.content });
                }

                send({ type: 'done' });
                controller.close();

            } catch (err) {
                console.error('[/api/chat] stream error:', err);
                const message = err?.status === 429
                    ? "I've hit the rate limit, sir. Give me a moment before your next request."
                    : (err.message || 'Something went wrong processing that.');
                send({ type: 'error', message });
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
        },
    });
}