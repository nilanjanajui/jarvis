export async function POST(req) {
    const { text } = await req.json();

    if (!process.env.ELEVENLABS_API_KEY) {
        return Response.json({ error: 'No ElevenLabs key' }, { status: 400 });
    }

    // "Adam" voice — deep and clear, closest to JARVIS
    const VOICE_ID = 'pNInz6obpgDQGcFmaJgB';

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
                    stability: 0.35,          // lower = more expressive, natural variation
                    similarity_boost: 0.82,   // truer to the voice character
                    style: 0.40,              // more expressive delivery
                    use_speaker_boost: true,
                },
            }),
        }
    );

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.error('[/api/speak] ElevenLabs error:', res.status, body);
        return Response.json({ error: 'TTS failed' }, { status: 500 });
    }

    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
        headers: { 'Content-Type': 'audio/mpeg' },
    });
}