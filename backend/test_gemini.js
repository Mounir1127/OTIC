require('dotenv').config({ path: __dirname + '/.env' });
const API_KEY = process.env.GEMINI_API_KEY;
const model = 'gemini-2.0-flash';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${API_KEY}`;

async function test() {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
            })
        });

        if (!response.ok) {
            console.error('Status:', response.status);
            console.error('Body:', await response.text());
            return;
        }

        const decoder = new TextDecoder();
        for await (const chunk of response.body) {
            const str = decoder.decode(chunk);
            console.log('Chunk:', str);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
