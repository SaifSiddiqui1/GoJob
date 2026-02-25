require('dotenv').config();
const axios = require('axios');

async function listModels() {
    try {
        console.log("Fetching models for API Key ending in: " + process.env.GEMINI_API_KEY.slice(-4));
        const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);

        const models = res.data.models;
        console.log("Total models available:", models.length);

        models.forEach(m => {
            console.log(`- ${m.name} (Supported actions: ${m.supportedGenerationMethods.join(', ')})`);
        });
    } catch (err) {
        console.error("Failed to fetch models:", err.response ? err.response.data : err.message);
    }
}

listModels();
