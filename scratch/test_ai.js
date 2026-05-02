import { config } from "../src/server/config.js";
import { callAI } from "../src/server/services/ai.js";

async function testAI() {
  console.log("Testing AI with config:", {
    model: config.groq.model,
    apiUrl: config.groq.apiUrl,
    hasKey: !!config.groq.apiKey
  });

  try {
    const reply = await callAI({ message: "Hello", history: [] });
    console.log("AI Reply:", reply);
  } catch (error) {
    console.error("AI Test Failed:", error.message);
    if (error.stack) console.error(error.stack);
  }
}

testAI();
