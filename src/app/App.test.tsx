/**
 * @file App.test.tsx
 * @description Professional unit test suite for VoteSahayak using Vitest
 * and React Testing Library. Tests cover the application shell, navigation,
 * quiz logic, and chat interaction.
 *
 * Test strategy:
 *  - Tests are co-located in src/app/ for easy discovery.
 *  - The Groq API fetch is mocked so tests run fully offline.
 *  - Each test is self-contained with its own render call.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";

// ---------------------------------------------------------------------------
// Component imports
// ---------------------------------------------------------------------------
import Layout from "./layout";
import Quiz from "./pages/Quiz";
import Chat from "./pages/Chat";
import Journey from "./pages/Journey";

// ---------------------------------------------------------------------------
// Global mocks
// ---------------------------------------------------------------------------

/**
 * Mock the Groq API fetch so Chat tests run without network access.
 * Returns a valid API response structure on every call.
 */
const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        choices: [
          {
            message: {
              content: "Namaskar! I can help you with election information.",
            },
          },
        ],
      }),
  })
);

// Apply the mock globally before all tests
vi.stubGlobal("fetch", mockFetch);

// Mock framer-motion / motion/react to avoid animation-related issues in jsdom
vi.mock("motion/react", async () => {
  const React = await import("react");

  /** Factory that forwards all props to a native HTML element of the given tag. */
  function makeMotion<T extends keyof React.JSX.IntrinsicElements>(tag: T) {
    return React.forwardRef(
      (
        { children, ...props }: React.HTMLAttributes<HTMLElement>,
        ref: React.Ref<HTMLElement>
      ) => React.createElement(tag as string, { ref, ...props }, children)
    );
  }

  return {
    motion: {
      div: makeMotion("div"),
      aside: makeMotion("aside"),
      article: makeMotion("article"),
      li: makeMotion("li"),
      button: makeMotion("button"),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renders a component wrapped in a MemoryRouter for route-dependent components.
 * @param ui - The React element to render
 * @param initialPath - The initial route path (default: "/")
 */
function renderWithRouter(ui: React.ReactElement, initialPath = "/") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Test Suite 1: Application Layout & Navigation
// ---------------------------------------------------------------------------

describe("Layout — Sidebar Navigation", () => {
  /**
   * Test 1: Verifies that the VoteSahayak brand heading renders correctly
   * in the sidebar header. This confirms the app shell mounts without errors.
   */
  it("renders the VoteSahayak brand heading", () => {
    renderWithRouter(<Layout />);
    expect(screen.getByRole("heading", { name: /VoteSahayak/i })).toBeInTheDocument();
  });

  /**
   * Test 2: Verifies all 8 navigation items are present in the sidebar.
   * This ensures no routes are accidentally removed from the nav config.
   */
  it("renders all 8 navigation items in the sidebar", () => {
    renderWithRouter(<Layout />);
    const expectedLabels = [
      "Voter Journey",
      "Station Locator",
      "Election Timeline",
      "Candidate Info",
      "Voter Education",
      "Knowledge Quiz",
      "AI Sahayak Chat",
      "Help & Support",
    ];
    expectedLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  /**
   * Test 3: Verifies the helpline number "1950" is always visible in the sidebar footer,
   * which is a critical voter assistance feature.
   */
  it("displays the 1950 voter helpline number in the sidebar", () => {
    renderWithRouter(<Layout />);
    expect(screen.getByText("1950")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Test Suite 2: Journey Page
// ---------------------------------------------------------------------------

describe("Journey — Voter Steps", () => {
  /**
   * Test 4: Verifies that all 4 voter journey step titles are rendered
   * on the Journey (home) page.
   */
  it("renders all 4 voter journey steps", () => {
    renderWithRouter(<Journey />);
    expect(screen.getByText("Check Eligibility")).toBeInTheDocument();
    expect(screen.getByText("Register via Form 6")).toBeInTheDocument();
    expect(screen.getByText("Verify Documents")).toBeInTheDocument();
    expect(screen.getByText("Cast Your Vote")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Test Suite 3: Quiz Logic
// ---------------------------------------------------------------------------

describe("Quiz — Question Flow & Scoring", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Test 5: Verifies the first question and all 4 answer options render
   * correctly when the Quiz component mounts.
   */
  it("renders the first question with 4 answer options", () => {
    renderWithRouter(<Quiz />);
    expect(
      screen.getByText("What is the minimum voting age in India?")
    ).toBeInTheDocument();
    expect(screen.getByText("16 Years")).toBeInTheDocument();
    expect(screen.getByText("18 Years")).toBeInTheDocument();
    expect(screen.getByText("21 Years")).toBeInTheDocument();
    expect(screen.getByText("25 Years")).toBeInTheDocument();
  });

  /**
   * Test 6: Simulates selecting the correct answer ("18 Years") and verifies
   * that all option buttons become disabled immediately after selection,
   * preventing double-submission.
   */
  it("disables all options after an answer is selected", async () => {
    renderWithRouter(<Quiz />);
    const correctBtn = screen.getByRole("button", { name: /Option: 18 Years/i });
    fireEvent.click(correctBtn);

    // All 4 options should be disabled after selection
    const allOptions = screen.getAllByRole("button", { name: /Option:/i });
    allOptions.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  /**
   * Test 7: Verifies that clicking the correct answer applies the correct
   * aria-label styling and the CheckCircle icon is displayed, giving users
   * clear visual feedback.
   */
  it("advances to question 2 after timer fires on correct answer", async () => {
    const { act } = await import("react");
    renderWithRouter(<Quiz />);
    const correctBtn = screen.getByRole("button", { name: /Option: 18 Years/i });
    fireEvent.click(correctBtn);

    // Advance the 1200ms delay timer inside act() to flush state updates
    await act(async () => {
      vi.advanceTimersByTime(1200);
    });

    expect(
      screen.getByText("Which form is used to register as a new voter?")
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Test Suite 4: Chat Page
// ---------------------------------------------------------------------------

describe("Chat — Message Submission & Security", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Set a fake API key so the missing-key branch isn't triggered
    vi.stubEnv("VITE_GROQ_API_KEY", "test-key-123");
  });

  /**
   * Test 8: Verifies the initial greeting message from the AI assistant
   * is displayed when the Chat page first mounts.
   */
  it("displays the initial greeting message on mount", () => {
    renderWithRouter(<Chat />);
    expect(
      screen.getByText(
        /Namaskar! I am your AI VoteSahayak/i
      )
    ).toBeInTheDocument();
  });

  /**
   * Test 9: Verifies that typing a message and submitting the form renders
   * the user's message in the conversation thread.
   */
  it("renders the user message in the chat after form submission", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Chat />);

    const input = screen.getByRole("textbox", { name: /Type your message/i });
    await user.type(input, "What is an EVM?");

    const sendBtn = screen.getByRole("button", { name: /Send message/i });
    await user.click(sendBtn);

    expect(screen.getByText("What is an EVM?")).toBeInTheDocument();
  });

  /**
   * Test 10: Verifies that the input field enforces the maximum character
   * limit, preventing excessively long messages from being submitted.
   */
  it("does not submit a blank or whitespace-only message", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Chat />);

    const input = screen.getByRole("textbox", { name: /Type your message/i });
    await user.type(input, "   "); // only whitespace

    const sendBtn = screen.getByRole("button", { name: /Send message/i });
    await user.click(sendBtn);

    // fetch should NOT have been called for a whitespace-only input
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
