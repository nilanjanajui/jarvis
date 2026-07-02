export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
        return Response.json({ error: 'Missing lat/lon' }, { status: 400 });
    }

    try {
        const res = await fetch(`https://wttr.in/${lat},${lon}?format=j1`);
        const data = await res.json();

        const cur = data.current_condition[0];
        const area = data.nearest_area[0];

        return Response.json({
            city: area.areaName[0].value,
            region: area.region?.[0]?.value || '',
            country: area.country[0].value,
            countryCode: area.countryCode?.[0]?.value || '',
            tempC: cur.temp_C,
            feelsLikeC: cur.FeelsLikeC,
            condition: cur.weatherDesc[0].value,
            humidity: cur.humidity,
            windKmph: cur.windspeedKmph,
            windDir: cur.winddir16Point,
            visibility: cur.visibility,
            lat,
            lon,
        });
    } catch (err) {
        console.error('[/api/weather] error:', err);
        return Response.json({ error: 'Failed to fetch weather' }, { status: 500 });
    }
}