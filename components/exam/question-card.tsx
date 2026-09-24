"use client";

import { Check, ChevronDown, Lightbulb, X } from "lucide-react";
import {
  CATEGORIES,
  type AnswerIndex,
  type Question,
  type QuestionResult,
} from "@/lib/exam/types";
import { useExamStore } from "@/store/exam-store-provider";
import { cn } from "@/lib/utils";

const numerals = ["①", "②", "③", "④"] as const;

interface QuestionCardProps {
  examId: string;
  question: Question;
  number: number;
  result?: QuestionResult;
  disabled?: boolean;
}

export function QuestionCard({
  examId,
  question,
  number,
  result,
  disabled,
}: QuestionCardProps) {
  const answer = useExamStore(
    (state) => state.sessions[examId]?.answers[question.id],
  );
  const markAnswer = useExamStore((state) => state.markAnswer);
  return (
    <article
      id={`question-${question.id}`}
      data-question-id={question.id}
      tabIndex={-1}
      aria-label={`${number}번 문제`}
      className="scroll-mt-24 rounded-2xl border border-border bg-card shadow-[0_3px_18px_-12px_#1b3d32] outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="p-5 sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xl font-semibold tracking-tight text-primary">
              {String(number).padStart(2, "0")}
              <span className="text-primary/35">.</span>
            </span>
            <span className="rounded-md bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              {
                CATEGORIES.find((category) => category.id === question.category)
                  ?.label
              }
            </span>
          </div>
          <span
            className={cn(
              "flex items-center gap-1 text-xs",
              result
                ? result.isCorrect
                  ? "text-primary"
                  : "text-destructive"
                : "text-muted-foreground",
            )}
          >
            {result ? (
              <>
                {result.isCorrect ? (
                  <Check className="size-3.5" />
                ) : (
                  <X className="size-3.5" />
                )}
                {result.isCorrect ? "정답" : "오답"}
              </>
            ) : answer !== undefined ? (
              <>
                <Check className="size-3.5 text-primary" />
                선택 완료
              </>
            ) : (
              "4점"
            )}
          </span>
        </div>
        <fieldset disabled={disabled || !!result}>
          <legend className="mb-5 w-full text-[16px] leading-relaxed font-semibold sm:text-lg">
            {question.text}
          </legend>
          <div className="space-y-2.5">
            {question.choices.map((choice, index) => {
              const selected = answer === index;
              const correct = result?.correctAnswer === index;
              const wrong = !!result && selected && !correct;
              return (
                <label
                  key={index}
                  className={cn(
                    "relative flex min-h-13 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-primary",
                    selected
                      ? "border-primary/55 bg-primary/5"
                      : "border-border/80 hover:border-primary/30 hover:bg-secondary/40",
                    correct && "border-primary bg-primary/7",
                    wrong && "border-destructive/50 bg-destructive/5",
                    (disabled || result) && "cursor-default",
                  )}
                >
                  <input
                    type="radio"
                    className="peer sr-only"
                    name={`${examId}-${question.id}`}
                    value={index}
                    checked={selected}
                    onChange={() =>
                      markAnswer(examId, question.id, index as AnswerIndex)
                    }
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full font-medium",
                      selected
                        ? "bg-primary text-white"
                        : "text-muted-foreground",
                      wrong && "bg-destructive",
                      correct && "bg-primary text-white",
                    )}
                  >
                    {selected || correct ? index + 1 : numerals[index]}
                  </span>
                  <span className={cn("flex-1", selected && "font-medium")}>
                    <span className="sr-only">{numerals[index]} </span>
                    {choice}
                  </span>
                  {correct && (
                    <span className="shrink-0 text-xs font-semibold text-primary">
                      정답
                    </span>
                  )}
                  {wrong && (
                    <X
                      className="mt-1 size-4 shrink-0 text-destructive"
                      aria-label="내 답 / 오답"
                    />
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
      {result && (
        <details
          open
          className="group border-t border-primary/10 bg-primary/4 px-5 py-4 sm:px-8"
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-primary">
            <Lightbulb className="size-4" />
            해설
            <span className="ml-1 text-[10px] font-normal text-muted-foreground">
              샘플 / AI 연동 예정
            </span>
            <ChevronDown className="ml-auto size-4 transition-transform group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-sm leading-7 text-foreground/80">
            <strong className="mr-2 text-primary">
              정답 {numerals[result.correctAnswer]}
            </strong>
            {result.explanation}
          </p>
        </details>
      )}
    </article>
  );
}
