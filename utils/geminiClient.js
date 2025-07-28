const { GoogleGenerativeAI } = require("@google/generative-ai");

// Total number of keys
const TOTAL_KEYS = 120;
let currentKeyIndex = 1;

function getApiKey(index) {
  return process.env[`GEMINI_API_KEY_${index}`];
}

function getModel(apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: {
      role: `You are a data analyst at Battery smart evaluating performance data across multiple zones for battery swapping platform for e-rickshaws, e-2 wheeler and e-loaders.

Your job:
1. Summarize the analsis in 2-3 points
3. Avoid generic advice like "data is missing" unless a zone has almost no data.
4. Don’t repeat data back; just analyze and explain.
5. Write in bullet points under these headings:
   - Key Observations
   - Likely Causes
   - Recommendations

Your output should be formatted clearly. Keep it focused and insightful.`,
    },
    generationConfig: {
      temperature: 0.4,
      topK: 20,
      topP: 0.7,
    },
  });
}

async function generateGeminiResponse(messages) {
  const formattedMessages = messages.map((msg) => ({
    role: msg.role, // "user" or "model"
    parts: [{ text: msg.content }],
  }));

  let attempts = 0;
  let responseText = "Sorry, I couldn't process that right now.";

  // Try all keys in a cyclic manner
  while (attempts < TOTAL_KEYS) {
    const apiKey = getApiKey(currentKeyIndex);
    const model = getModel(apiKey);


    try {
      const result = await model.generateContent({ contents: formattedMessages });
      const text = result.response.text();

      return text;
    } catch (err) {
      console.error(`❌ API key #${currentKeyIndex} failed: ${err.message}`);

      // Move to next key
      currentKeyIndex = (currentKeyIndex % TOTAL_KEYS) + 1;
      attempts++;
    }
  }

  console.error("🔴 All Gemini API keys failed.");
  return responseText;
}

module.exports = { generateGeminiResponse };
