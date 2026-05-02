import { config } from "../config.js";

/**
 * Calls the Groq AI API with the provided message and history.
 */
export const callAI = async ({ message, history, signal }) => {
  if (!config.groq.apiKey) {
    throw new Error("GROQ_API_KEY is missing in .env file");
  }

  const messages = [
    { role: "system", content: "You are VoteSahayak, a professional civic assistant for Indian elections. Provide neutral, educational information." },
    ...history,
    { role: "user", content: message }
  ];

  const response = await fetch(config.groq.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.groq.apiKey}`,
    },
    body: JSON.stringify({
      model: config.groq.model,
      messages,
      temperature: 0.2,
      max_tokens: 1000,
    }),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unknown error");
    throw new Error(`AI API Error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "I couldn't generate a response.";
};
