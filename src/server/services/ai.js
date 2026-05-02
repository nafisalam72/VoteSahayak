import { config } from "../config.js";

export const callAI = async ({ message, history, signal }) => {
  if (!config.groq.apiKey) throw new Error("AI not configured");

  const messages = [
    { role: "system", content: "You are VoteSahayak, a civic assistant for Indian elections." },
    ...history,
    { role: "user", content: message }
  ];

  const res = await fetch(config.groq.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.groq.apiKey}`,
    },
    body: JSON.stringify({
      model: config.groq.model,
      messages,
      temperature: 0.2,
      max_tokens: 500,
    }),
    signal,
  });

  if (!res.ok) throw new Error("AI request failed");
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
};
