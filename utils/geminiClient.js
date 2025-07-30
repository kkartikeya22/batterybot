const { GoogleGenerativeAI } = require("@google/generative-ai");

const TOTAL_KEYS = 120;
let currentKeyIndex = 1;

function getApiKey(index) {
  return process.env[`GEMINI_API_KEY_${index}`];
}

function getModel(apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: {
      role: `You are a data analyst at Battery smart evaluating performance data across multiple zones for battery swapping platform for e-rickshaws, e-2 wheeler and e-loaders.

Your job:
1. Summarize the analysis in 2-3 points
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
      thinkingConfig: {
        thinkingBudget: 8000,
        includeThoughts: true,
      },
    },
  });
}

async function generateGeminiResponse(messages) {
  const formatted = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  let attempts = 0;

  while (attempts < TOTAL_KEYS) {
    const model = getModel(getApiKey(currentKeyIndex));
    try {
      const res = await model.generateContent({ contents: formatted });

      // 🔍 Log full Gemini response for inspection

      const parts = res?.response?.candidates?.[0]?.content?.parts || [];

      const thoughtPart = parts.find((p) => p.thought);
      const answerParts = parts.filter((p) => !p.thought);

      const thought = thoughtPart?.text || "";
      const answer = answerParts.map((p) => p.text).join("\n\n").trim();

      return {
        thought,
        answer,
        raw: res.response, // optional: helpful for debugging/logging
      };

    } catch (err) {
      console.error(`❌ Key ${currentKeyIndex} failed: ${err.message}`);
      currentKeyIndex = (currentKeyIndex % TOTAL_KEYS) + 1;
      attempts++;
    }
  }

  console.error("⚠️ All Gemini API keys failed.");
  return {
    thought: "",
    answer: "⚠️ Battery Bot is down, will be back soon.",
    raw: null,
  };
}

module.exports = { generateGeminiResponse };
