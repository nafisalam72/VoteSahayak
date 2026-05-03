/**
 * @file pages/Chat.tsx
 * @description Secure AI VoteSahayak chat interface.
 *
 * The browser never receives the Groq API key. Messages are validated on the
 * client for fast feedback, then sent to the Cloud Run server at /api/chat,
 * where rate limiting, Firebase token verification, caching, and upstream AI
 * calls are handled.
 */

import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import { Send, Bot, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getCurrentIdToken } from "@/lib/firebase";
import { MAX_CHAT_INPUT_LENGTH, sanitizeUserText } from "@/lib/security";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

const CHAT_API_ENDPOINT = "/api/chat";
const CHAT_TIMEOUT_MS = 20_000;

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  content:
    "Namaskar! I am your AI VoteSahayak. How can I assist you with the election process today?",
};

type ChatApiResponse = {
  reply?: string;
  error?: string;
  code?: string;
};

function createMessageId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function getFriendlyApiError(status: number, response?: ChatApiResponse): string {
  if (status === 401) {
    return "Please sign in again before using the AI assistant.";
  }

  if (status === 429) {
    return "You have reached the chat rate limit. Please wait a minute and try again.";
  }

  if (status === 503) {
    if (response?.code === "ai_not_configured") {
      return "The AI assistant is not configured on the server yet. Please contact support.";
    }
    if (response?.code === "ai_auth_error") {
      return "AI service authentication failed. Please contact support to verify credentials.";
    }
    return "The AI service is temporarily unavailable. Please try again later.";
  }

  if (status === 504) {
    return "AI service request timed out. Please try a shorter question.";
  }

  return response?.error || "Sorry, I could not connect to the AI assistant right now.";
}

interface ChatMessageProps {
  message: Message;
}

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

const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-2 text-gray-400"
      aria-live="polite"
      aria-label="AI is thinking"
    >
      <RefreshCw className="animate-spin w-4 h-4" aria-hidden="true" />
      <span>Thinking...</span>
    </div>
  );
});

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const appendErrorMessage = useCallback((friendlyMessage: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId("err"),
        role: "assistant",
        content: friendlyMessage,
      },
    ]);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const sanitized = sanitizeUserText(input, MAX_CHAT_INPUT_LENGTH);
      if (!sanitized || isLoading) return;

      const userMsg: Message = {
        id: createMessageId("user"),
        role: "user",
        content: sanitized,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);

      try {
        const idToken = await getCurrentIdToken();
        const history = messages
          .filter((message) => message.id !== INITIAL_MESSAGE.id)
          .slice(-8)
          .map((message) => ({
            role: message.role === "system" ? "assistant" : message.role,
            content: sanitizeUserText(message.content, 2000),
          }));

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (idToken) {
          headers.Authorization = `Bearer ${idToken}`;
        }

        const response = await fetch(CHAT_API_ENDPOINT, {
          method: "POST",
          headers,
          body: JSON.stringify({
            message: sanitized,
            history,
          }),
          signal: controller.signal,
        });

        const data = (await response.json().catch(() => ({}))) as ChatApiResponse;

        if (!response.ok) {
          appendErrorMessage(getFriendlyApiError(response.status, data));
          return;
        }

        const assistantText = sanitizeUserText(
          data.reply || "I received an empty response. Please try again.",
          2000
        );

        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId("ai"),
            role: "assistant",
            content: assistantText,
          },
        ]);
      } catch {
        appendErrorMessage(
          "Sorry, I couldn't connect to the AI right now. Please check your internet connection and try again."
        );
      } finally {
        window.clearTimeout(timeout);
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, appendErrorMessage]
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-[#0B141A]">
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
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-slate-900 border-t border-slate-800 p-4">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-3"
          aria-label="Send a message to AI VoteSahayak"
        >
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type your question... (max 500 characters)"
            className="flex-1 bg-slate-800 text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={isLoading}
            maxLength={MAX_CHAT_INPUT_LENGTH}
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
