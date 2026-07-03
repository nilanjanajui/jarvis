import { DEFAULT_VOICE_ID } from '@/lib/voices';

export async function POST(req) {
    const { text, voiceId } = await req.json();

    if (!process.env.ELEVENLABS_API_KEY) {
        return Response.json({ error: 'No ElevenLabs key' }, { status: 400 });
    }

    const VOICE_ID = voiceId || DEFAULT_VOICE_ID;

    const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
            method: 'POST',
            headers: {
                'xi-api-key': process.env.ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.35,
                    similarity_boost: 0.82,
                    style: 0.40,
                    use_speaker_boost: true,
                },
            }),
        }
    );

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('[/api/speak] ElevenLabs error:', res.status, 'voiceId:', VOICE_ID, body);
        // Surface the real reason to the client for debugging
        return Response.json({
            error: 'TTS failed',
            status: res.status,
            voiceId: VOICE_ID,
            detail: body,
        }, { status: 500 });
    }

    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
        headers: { 'Content-Type': 'audio/mpeg' },
    });
}