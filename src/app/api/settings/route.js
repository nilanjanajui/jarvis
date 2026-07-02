export async function GET() {
    return Response.json({
        keys: {
            groq: Boolean(process.env.GROQ_API_KEY),
            serper: Boolean(process.env.SERPER_API_KEY),
            elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
        },
    });
}