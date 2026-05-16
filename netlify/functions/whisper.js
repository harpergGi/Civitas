exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const body = JSON.parse(event.body);
        const audioBuffer = Buffer.from(body.audio, 'base64');
        
        // Package the audio file perfectly for Whisper
        const blob = new Blob([audioBuffer], { type: 'audio/webm' }); 
        const formData = new FormData();
        formData.append('file', blob, 'audio.webm');
        formData.append('model', 'whisper-1');

        // Send it to the Whisper AI
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: formData
        });

        if (!response.ok) throw new Error('Whisper API error');
        const data = await response.json();

        // Send the perfectly transcribed text back to the app
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.text })
        };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};
