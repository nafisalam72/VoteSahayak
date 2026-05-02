/**
 * @file pages/Chat.tsx
 * @description AI VoteSahayak Chat interface page.
 *
 * Provides a WhatsApp-inspired chat UI that connects to the Groq LLM API
 * (llama-3.3-70b-versatile) to answer questions about the Indian electoral
 * process. Security measures include input length enforcement, whitespace
 * rejection, and user-friendly error messaging (raw API errors are never
 * shown to the user).
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
} from "react";
import { Send, Bot, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Groq API key loaded from environment variables (never hard-coded). */
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

/** Maximum number of characters allowed in the user's input field. */
const MAX_INPUT_LENGTH = 500;

/** System prompt defining the AI assistant's persona and scope. */
const SYSTEM_PROMPT =
  "You are VoteSahayak, an AI assistant for Indian elections. " +
  "Answer clearly, concisely, and helpfully. Keep responses under 150 words. " +
  "Only answer questions related to Indian elections, voter registration, EVMs, " +
  "polling booths, and related civic topics.";

/** Initial greeting message shown before the user sends anything. */
const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  content:
    "Namaskar! I am your AI VoteSahayak. How can I assist you with the election process today?",
};

// ---------------------------------------------------------------------------
// ChatMessage sub-component
// ---------------------------------------------------------------------------

interface ChatMessageProps {
  /** The message data to render. */
  message: Message;
}

/**
 * Renders a single chat bubble, memoized to avoid re-renders when other
 * messages are added to the conversation thread.
 *
 * @param props.message - The message to display.
 */
const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-3 shadow-md",
          isUser
            ? "bg-emerald-700 text-white"
            : "bg-slate-800 text-white border border-slate-700"
        )}
      >
        {message.content}
      </div>
    </motion.div>
  );
});

// ---------------------------------------------------------------------------
// TypingIndicator sub-component
// ---------------------------------------------------------------------------

/**
 * Animated indicator shown while the AI is generating a response.
 * Rendered as a pure functional component (no props, always same output).
 */
const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-2 text-gray-400"
      aria-live="polite"
      aria-label="AI is thinking"
    >
      <RefreshCw className="animate-spin w-4 h-4" aria-hidden="true" />
      <span>Thinking…</span>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Chat (default export)
// ---------------------------------------------------------------------------

/**
 * Chat page component — the main AI assistant interface.
 *
 * Manages conversation state, sends messages to the Groq API, and renders
 * the message thread. All API errors are caught and surfaced as friendly
 * in-chat messages instead of raw technical strings.
 *
 * @returns The full chat UI including header, message thread, and input form.
 */
export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Smoothly scrolls the message container to the most recent message.
   * Called whenever the `messages` array changes.
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  /**
   * Appends an assistant error message to the conversation.
   * Accepts a user-friendly string — never raw API error details.
   *
   * @param friendlyMessage - A short, plain-English error description.
   */
  const appendErrorMessage = useCallback((friendlyMessage: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: friendlyMessage,
      },
    ]);
  }, []);

  // ---------------------------------------------------------------------------
  // Form handler
  // ---------------------------------------------------------------------------

  /**
   * Handles the chat form submission:
   * 1. Validates and sanitizes the input.
   * 2. Appends the user message to the conversation.
   * 3. Calls the Groq API with the full message history.
   * 4. Appends the AI response (or a friendly error) to the conversation.
   *
   * @param e - The form submit event.
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // --- Security: sanitize and validate input ---
      const sanitized = input.trim().slice(0, MAX_INPUT_LENGTH);
      if (!sanitized || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: sanitized,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      // --- Guard: missing API key ---
      if (!GROQ_API_KEY || GROQ_API_KEY.trim() === "") {
        appendErrorMessage(
          "The AI assistant is not configured. Please add VITE_GROQ_API_KEY to your .env file."
        );
        return;
      }

      setIsLoading(true);

      try {
        const chatHistory = [...messages, userMsg];

        const payload = {
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
          ],
        };

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          // Do not expose raw API error text to the user
          throw new Error(`HTTP ${res.status}`);
        }

        const data = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };

        const assistantText =
          data?.choices?.[0]?.message?.content?.trim() ??
          "I received an empty response. Please try again.";

        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: assistantText,
          },
        ]);
      } catch {
        // Surface a friendly message — never log sensitive details to console
        appendErrorMessage(
          "Sorry, I couldn't connect to the AI right now. Please check your internet connection and try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, appendErrorMessage]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-[#0B141A]">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center"
            aria-hidden="true"
          >
            <Bot className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              AI VoteSahayak
            </h2>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full bg-green-500 animate-pulse"
                aria-hidden="true"
              />
              Online
            </p>
          </div>
        </div>
      </div>

      {/* Message thread */}
      <div
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Chat conversation"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {isLoading && <TypingIndicator />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <div className="bg-slate-900 border-t border-slate-800 p-4">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3"
          aria-label="Send a message to AI VoteSahayak"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question… (max 500 characters)"
            className="flex-1 bg-slate-800 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={isLoading}
            maxLength={MAX_INPUT_LENGTH}
            aria-label="Type your message to VoteSahayak"
            id="chat-input"
            autoComplete="off"
          />

          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white p-3 rounded-full transition-colors"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            id="chat-send-btn"
          >
            <Send className="w-5 h-5" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}