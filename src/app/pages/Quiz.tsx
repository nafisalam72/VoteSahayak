/**
 * @file pages/Quiz.tsx
 * @description Voter Knowledge Quiz page for VoteSahayak.
 *
 * Presents a timed multiple-choice quiz. On completion, users download
 * a PDF Certificate and upload it to Cloud Storage.
 */

import React, { useState, useRef, useCallback, memo } from "react";
import { motion } from "motion/react";
import { Award, CheckCircle, XCircle, ArrowRight, Download } from "lucide-react";
import { clsx } from "clsx";
import { getCurrentIdToken } from "@/lib/firebase";
import type { QuizQuestion } from "@/types";

const QUESTIONS: QuizQuestion[] = [
  {
    question: "What is the minimum voting age in India?",
    options: ["16 Years", "18 Years", "21 Years", "25 Years"],
    correct: 1,
  },
  {
    question: "Which form is used to register as a new voter?",
    options: ["Form 4", "Form 6", "Form 8", "Form 9"],
    correct: 1,
  },
  {
    question: "What does EVM stand for?",
    options: ["Electronic Voting Machine", "Electoral Validating Machine", "Electronic Verification Module", "Election Value Metric"],
    correct: 0,
  },
  {
    question: "Who conducts the Lok Sabha elections in India?",
    options: ["Supreme Court of India", "Election Commission of India", "Parliament of India", "Ministry of Home Affairs"],
    correct: 1,
  },
];

/**
 * Renders a single answer option button.
 * @param {object} props - Component props.
 */
const QuizOption = memo(function QuizOption({ option, index, selectedOption, correctIndex, onSelect }: any) {
  const isSelected = selectedOption === index;
  const isCorrect = index === correctIndex;
  const showFeedback = selectedOption !== null;

  return (
    <button
      onClick={() => onSelect(index)}
      disabled={selectedOption !== null}
      aria-label={`Option: ${option}`}
      className={clsx(
        "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between font-medium",
        !showFeedback && "border-slate-800 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800 text-slate-200",
        showFeedback && isCorrect && "border-green-500 bg-green-500/10 text-green-400",
        showFeedback && isSelected && !isCorrect && "border-red-500 bg-red-500/10 text-red-400",
        showFeedback && !isSelected && "border-slate-800 opacity-50 text-slate-400"
      )}
    >
      <span>{option}</span>
      {showFeedback && isCorrect && <CheckCircle className="w-5 h-5 text-green-500" />}
      {showFeedback && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
    </button>
  );
});

/**
 * Quiz completion results screen.
 * @param {object} props - Component props.
 */
const QuizResult = memo(function QuizResult({ score, total, onDownload, onRetake }: any) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-slate-900 to-green-600/10" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-orange-500/20">
          <Award className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-100 mb-2">Quiz Completed!</h2>
        <p className="text-slate-400 mb-8">You scored <span className="text-xl font-bold text-white">{score}</span> out of {total}</p>
        <button onClick={onDownload} className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-600/20">
          <Download className="w-5 h-5" /> Download Certificate
        </button>
        <button onClick={onRetake} className="mt-4 text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1">
          Retake Quiz <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
});

/**
 * Main Quiz component.
 */
export default function Quiz() {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const timerRef = useRef<any>(null);

  const handleSelect = useCallback((idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (idx === QUESTIONS[currentQ].correct) setScore((s) => s + 1);
    timerRef.current = setTimeout(() => {
      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ((c) => c + 1);
        setSelectedOption(null);
      } else {
        setShowResult(true);
      }
    }, 1200);
  }, [selectedOption, currentQ]);

  const handleRetake = useCallback(() => {
    setCurrentQ(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
  }, []);

  const drawBorders = (doc: any) => {
    doc.setFillColor(255, 245, 230);
    doc.rect(0, 0, 297, 210, "F");
    doc.setDrawColor(255, 153, 51);
    doc.setLineWidth(5);
    doc.rect(10, 10, 277, 190);
    doc.setDrawColor(19, 136, 8);
    doc.setLineWidth(2);
    doc.rect(15, 15, 267, 180);
  };

  const drawText = (doc: any, score: number) => {
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.text("Certificate of Civic Excellence", 148, 50, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(18);
    doc.text("This certificate is proudly presented to", 148, 80, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(255, 153, 51);
    doc.text("A Responsible Citizen", 148, 105, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.setTextColor(50, 50, 50);
    doc.text(`For completing the VoteSahayak Quiz with score ${score}/${QUESTIONS.length}.`, 148, 135, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 148, 180, { align: "center" });
  };

  const generatePDF = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF("landscape");
    drawBorders(doc);
    drawText(doc, score);
    doc.save("VoteSahayak_Certificate.pdf");
    
    // Upload to Cloud Storage
    const base64 = doc.output("datauristring").split(",")[1];
    const idToken = await getCurrentIdToken();
    if (idToken) {
      await fetch("/api/vote/certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({ fileName: "certificate.pdf", data: base64 }),
      });
    }
  }, [score]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pt-6">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-slate-100">Voter Knowledge Quiz</h1>
        <p className="text-slate-400">Test your knowledge about the Indian electoral process.</p>
      </div>

      {!showResult ? (
        <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
            <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${(currentQ / QUESTIONS.length) * 100}%` }} />
          </div>
          <div className="text-sm font-medium text-orange-500 mb-6 uppercase tracking-wider">Question {currentQ + 1} of {QUESTIONS.length}</div>
          <h2 className="text-2xl font-semibold text-slate-100 mb-8">{QUESTIONS[currentQ].question}</h2>
          <div className="space-y-3">
            {QUESTIONS[currentQ].options.map((opt, idx) => (
              <QuizOption key={`${currentQ}-${idx}`} option={opt} index={idx} selectedOption={selectedOption} correctIndex={QUESTIONS[currentQ].correct} onSelect={handleSelect} />
            ))}
          </div>
        </motion.div>
      ) : (
        <QuizResult score={score} total={QUESTIONS.length} onDownload={generatePDF} onRetake={handleRetake} />
      )}
    </div>
  );
}
