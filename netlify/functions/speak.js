exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const body = JSON.parse(event.body);
        
        // This connects to OpenAI's ultra-realistic TTS engine
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "tts-1",
                input: body.text,
                voice: "nova" // "Nova" is a highly professional, modern American female voice
            }),
        });

        if (!response.ok) throw new Error('Voice API error');
        
        // Convert the audio into a secure format to send to the phone
        const buffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(buffer).toString('base64');

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64Audio })
        };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};
