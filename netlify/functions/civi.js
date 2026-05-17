exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const body = JSON.parse(event.body);
        const userMessage = body.messages?.[0]?.content || '';
        
        // This guarantees your custom system prompt rules are enforced!
        const systemPrompt = body.system || "You are a helpful legal document assistant.";

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Fast, incredibly smart with statutory codes
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                temperature: 0.3
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`AI Gateway Error: ${errText}`);
        }

        const data = await response.json();
        const aiText = data.choices[0].message.content;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: [{ text: aiText }]
            })
        };

    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};
