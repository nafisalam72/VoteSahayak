/**
 * @file setup.ts
 * @description Global test setup for the VoteSahayak test suite.
 * Imports @testing-library/jest-dom to extend Vitest's `expect` with
 * DOM-specific matchers such as `toBeInTheDocument`, `toHaveClass`, etc.
 */
import '@testing-library/jest-dom';

/**
 * jsdom does not implement Element.scrollIntoView — stub it globally so
 * Chat.tsx's scrollToBottom() callback doesn't throw during tests.
 */
window.HTMLElement.prototype.scrollIntoView = function () {};
