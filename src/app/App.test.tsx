/**
 * @file App.test.tsx
 * @description Professional unit test suite for VoteSahayak using Vitest
 * and React Testing Library.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import React from "react";

// Component imports
import Layout from "./layout";
import Quiz from "./pages/Quiz";
import Chat from "./pages/Chat";
import Journey from "./pages/Journey";

// Global mocks
const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ reply: "Namaskar!", cached: false }),
  })
);
vi.stubGlobal("fetch", mockFetch);

// Mock jsPDF
vi.mock("jspdf", () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    setFillColor: vi.fn(), rect: vi.fn(), setDrawColor: vi.fn(), setLineWidth: vi.fn(),
    setTextColor: vi.fn(), setFont: vi.fn(), setFontSize: vi.fn(), text: vi.fn(), save: vi.fn(),
    output: vi.fn().mockReturnValue("data:application/pdf;base64,mock"),
  })),
}));

// Mock motion/react with prop filtering
vi.mock("motion/react", async () => {
  const React = await import("react");
  const motionProps = ["layoutId", "initial", "animate", "exit", "transition", "variants", "whileHover", "whileTap"];
  
  function makeMotion(tag: string) {
    return React.forwardRef(({ children, ...props }: any, ref: any) => {
      const filteredProps = { ...props };
      motionProps.forEach(p => delete filteredProps[p]);
      return React.createElement(tag, { ref, ...filteredProps }, children);
    });
  }

  return {
    motion: {
      div: makeMotion("div"),
      aside: makeMotion("aside"),
      article: makeMotion("article"),
      li: makeMotion("li"),
      button: makeMotion("button"),
      nav: makeMotion("nav"),
      span: makeMotion("span"),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

function renderWithRouter(ui: React.ReactElement, initialPath = "/") {
  return render(<MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>);
}

describe("Layout — Sidebar Navigation", () => {
  it("renders the VoteSahayak brand heading", () => {
    renderWithRouter(<Layout />);
    expect(screen.getByRole("heading", { name: /VoteSahayak/i })).toBeDefined();
  });

  it("renders all 8 navigation items in the sidebar", () => {
    renderWithRouter(<Layout />);
    ["Voter Journey", "Station Locator", "Election Timeline", "Candidate Info", "Voter Education", "Knowledge Quiz", "AI Sahayak Chat", "Help & Support"].forEach(label => {
      expect(screen.getByText(label)).toBeDefined();
    });
  });
});

describe("Journey — Voter Steps", () => {
  it("renders all 4 voter journey steps", () => {
    renderWithRouter(<Journey />);
    ["Check Eligibility", "Register via Form 6", "Verify Documents", "Cast Your Vote"].forEach(step => {
      expect(screen.getByText(step)).toBeDefined();
    });
  });
});

describe("Quiz — Question Flow", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("renders the first question with 4 answer options", () => {
    renderWithRouter(<Quiz />);
    expect(screen.getByText(/What is the minimum voting age/i)).toBeDefined();
    expect(screen.getAllByRole("button", { name: /Option:/i })).toHaveLength(4);
  });

  it("disables all options after an answer is selected", async () => {
    renderWithRouter(<Quiz />);
    const correctBtn = screen.getByRole("button", { name: /Option: 18 Years/i });
    fireEvent.click(correctBtn);
    screen.getAllByRole("button", { name: /Option:/i }).forEach(btn => {
      expect(btn).toBeDisabled();
    });
  });

  it("advances to question 2 after timer fires", async () => {
    renderWithRouter(<Quiz />);
    const correctBtn = screen.getByRole("button", { name: /Option: 18 Years/i });
    fireEvent.click(correctBtn);
    await act(async () => { vi.advanceTimersByTime(1200); });
    expect(screen.getByText(/Which form is used to register/i)).toBeDefined();
  });
});

describe("Chat — Message Submission", () => {
  beforeEach(() => { mockFetch.mockClear(); });

  it("displays the initial greeting message on mount", () => {
    renderWithRouter(<Chat />);
    expect(screen.getByText(/Namaskar! I am your AI VoteSahayak/i)).toBeDefined();
  });

  it("renders the user message in the chat after submission", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Chat />);
    const input = screen.getByPlaceholderText(/Type your question/i);
    await user.type(input, "Hello AI");
    const sendBtn = screen.getByLabelText(/Send message/i);
    await user.click(sendBtn);
    expect(screen.getByText("Hello AI")).toBeDefined();
  });
});
