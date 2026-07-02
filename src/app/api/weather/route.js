export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
        return Response.json({ error: 'Missing lat/lon' }, { status: 400 });
    }

    try {
        // Weather data from wttr.in
        const weatherRes = await fetch(`https://wttr.in/${lat},${lon}?format=j1`);
        const weatherData = await weatherRes.json();
        const cur = weatherData.current_condition[0];

        // Accurate city/locality from BigDataCloud reverse geocoding — no API key needed
        let city = null, region = null, country = null, countryCode = null;
        try {
            const geoRes = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
            );
            const geoData = await geoRes.json();
            city = geoData.city || geoData.locality || geoData.principalSubdivision;
            region = geoData.principalSubdivision;
            country = geoData.countryName;
            countryCode = geoData.countryCode;
        } catch {
            // Fall back to wttr.in's area name if BigDataCloud fails
            const area = weatherData.nearest_area[0];
            city = area.areaName[0].value;
            country = area.country[0].value;
            countryCode = area.countryCode?.[0]?.value;
        }

        return Response.json({
            city,
            region,
            country,
            countryCode,
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