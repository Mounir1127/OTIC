require('dotenv').config({ path: __dirname + '/.env' });
const API_KEY = process.env.OPENROUTER_API_KEY;
const model = 'openrouter/auto';
const url = 'https://openrouter.ai/api/v1/chat/completions';

async function test() {
    console.log('Testing OpenRouter connection...');
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'user', content: 'Say hello' }]
            })
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));

    } catch (e) {
        console.error('Error:', e);
    }
}

test();
