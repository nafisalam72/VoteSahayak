import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Quiz from "./Quiz";
import React from "react";

// Robust mock for jsPDF
const MockDoc = vi.fn().mockImplementation(function(this: any) {
  this.setFillColor = vi.fn();
  this.rect = vi.fn();
  this.setDrawColor = vi.fn();
  this.setLineWidth = vi.fn();
  this.setTextColor = vi.fn();
  this.setFont = vi.fn();
  this.setFontSize = vi.fn();
  this.text = vi.fn();
  this.save = vi.fn();
  this.output = vi.fn().mockReturnValue("data:application/pdf;base64,mock");
});

vi.mock("jspdf", () => ({
  jsPDF: MockDoc
}));

describe("Quiz Component", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("advances questions correctly", async () => {
    render(<Quiz />);
    const option = screen.getByText("18 Years");
    
    await act(async () => {
      fireEvent.click(option);
      vi.advanceTimersByTime(1500);
    });
    
    expect(screen.getByText(/Question 2 of 4/i)).toBeDefined();
  });

  it("completes and resets quiz", async () => {
    render(<Quiz />);
    for (let i = 0; i < 4; i++) {
      const options = screen.getAllByRole("button", { name: /Option:/i });
      await act(async () => {
        fireEvent.click(options[0]);
        vi.advanceTimersByTime(1500);
      });
    }
    expect(screen.getByText(/Quiz Completed!/i)).toBeDefined();
    
    const downloadBtn = screen.getByText(/Download Certificate/i);
    await act(async () => {
      fireEvent.click(downloadBtn);
    });
    
    const retakeBtn = screen.getByText(/Retake Quiz/i);
    await act(async () => {
      fireEvent.click(retakeBtn);
    });
    expect(screen.getByText(/Question 1 of 4/i)).toBeDefined();
  });
});
