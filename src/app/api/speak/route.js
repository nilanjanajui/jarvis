import { DEFAULT_VOICE_ID, VOICES } from '@/lib/voices';
import { rateLimit } from '@/lib/rateLimit';

const MAX_CHARS = 3000;

export async function POST(req) {
    if (!rateLimit(req, { limit: 20 })) {
        return Response.json({ error: 'Too many requests' }, { status: 429 });
    }
    if (!process.env.ELEVENLABS_API_KEY) {
        return Response.json({ error: 'No ElevenLabs key' }, { status: 400 });
    }

    let body;
    try { body = await req.json(); } catch { return Response.json({ error: 'Bad JSON' }, { status: 400 }); }
    const { text, voiceId } = body;

    if (typeof text !== 'string' || !text.trim() || text.length > MAX_CHARS) {
        return Response.json({ error: 'Invalid text' }, { status: 400 });
    }
    const VOICE_ID = VOICES.some(v => v.id === voiceId) ? voiceId : DEFAULT_VOICE_ID;

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: 'POST',
        headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.35, similarity_boost: 0.82, style: 0.40, use_speaker_boost: true },
        }),
    });

    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        console.error('[/api/speak] ElevenLabs error:', res.status, VOICE_ID, detail);
        return Response.json({ error: 'TTS failed', status: res.status }, { status: 500 });
    }
    return new Response(await res.arrayBuffer(), { headers: { 'Content-Type': 'audio/mpeg' } });
}