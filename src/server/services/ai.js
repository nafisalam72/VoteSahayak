import { config } from "../config.js";

/**
 * Calls the Groq AI API with the provided message and history.
 */
export const callAI = async ({ message, history, signal }) => {
  if (!config.groq.apiKey) {
    const error = new Error("GROQ_API_KEY is missing in .env file");
    error.code = "ai_not_configured";
    throw error;
  }

  if (!message || typeof message !== "string") {
    throw new Error("Invalid message format");
  }

  const messages = [
    { role: "system", content: "You are VoteSahayak, a professional civic assistant for Indian elections. Provide neutral, educational information." },
    ...history,
    { role: "user", content: message }
  ];

  try {
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
      console.error(`AI API Error (${response.status}):`, errorBody);
      
      if (response.status === 401 || response.status === 403) {
        const error = new Error("API key is invalid or expired");
        error.code = "ai_auth_error";
        throw error;
      }
      
      if (response.status === 429) {
        const error = new Error("Rate limit exceeded. Please try again later.");
        error.code = "ai_rate_limit";
        throw error;
      }
      
      throw new Error(`AI API Error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    
    if (!reply) {
      throw new Error("Empty response from AI service");
    }
    
    return reply;
  } catch (e) {
    // Preserve custom error codes
    if (e.code) {
      throw e;
    }
    // Handle fetch/network errors
    if (e.name === "AbortError") {
      const error = new Error("AI request timed out");
      error.code = "ai_timeout";
      throw error;
    }
    throw e;
  }
};
