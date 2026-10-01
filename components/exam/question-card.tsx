"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Answers, Exam } from "@/lib/exam/types";
import {
  fetchQuestionSolution,
  questionSolutionQueryKey,
} from "@/lib/exam/client";
import type { AnswerIndex, Question, QuestionResult } from "@/lib/exam/types";
import { useExamStore } from "@/store/exam-store-provider";
import { cn } from "@/lib/utils";

const numerals = ["①", "②", "③", "④"] as const;

interface QuestionCardProps {
  exam: Exam;
  examId: string;
  question: Question;
  number: number;
  answers: Answers;
  result?: QuestionResult;
  disabled?: boolean;
}

export function QuestionCard({
  exam,
  examId,
  question,
  number,
  answers,
  result,
  disabled,
}: QuestionCardProps) {
  const [solutionOpen, setSolutionOpen] = useState(false);
  const answer = useExamStore(
    (state) => state.sessions[examId]?.answers[String(question.id)],
  );
  const markAnswer = useExamStore((state) => state.markAnswer);
  const clearAnswer = useExamStore((state) => state.clearAnswer);
  const solutionQuery = useQuery({
    queryKey: questionSolutionQueryKey(examId, question.id),
    queryFn: ({ signal }) =>
      fetchQuestionSolution(exam, question.id, answers, signal),
    enabled: false,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const solution = result ?? solutionQuery.data;
  const solutionVisible = Boolean(result) || solutionOpen;
  const locked = Boolean(result) || solutionOpen;

  function handleSolutionAction() {
    if (solutionOpen) {
      clearAnswer(examId, String(question.id));
      setSolutionOpen(false);
      return;
    }
    setSolutionOpen(true);
    if (!solutionQuery.data) void solutionQuery.refetch();
  }

  return (
    <article
      id={`question-${question.id}`}
      data-question-id={question.id}
      tabIndex={-1}
      aria-label={`${number}번 문제`}
      className="scroll-mt-24 rounded-2xl border border-border bg-card shadow-[0_3px_18px_-12px_#1b3d32] outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="p-5 sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <span className="font-mono text-xl font-semibold tracking-tight text-primary">
            {String(number).padStart(2, "0")}
            <span className="text-primary/35">.</span>
          </span>
          {!result && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-expanded={solutionOpen}
              aria-controls={`solution-${question.id}`}
              onClick={handleSolutionAction}
            >
              {solutionOpen ? "다시 풀기" : "정답 보기"}
            </Button>
          )}
        </div>
        <fieldset disabled={disabled || locked}>
          <legend className="mb-5 w-full text-[16px] leading-relaxed font-semibold sm:text-lg">
            {question.text}
          </legend>
          <div className="space-y-2.5">
            {question.choices.map((choice, index) => {
              const selected = answer === index;
              const correct =
                solutionVisible && solution?.correctAnswer === index;
              const wrong = solutionVisible && selected && !correct;
              return (
                <label
                  key={index}
                  onClick={(event) => {
                    if (locked || !selected) return;
                    event.preventDefault();
                    clearAnswer(examId, String(question.id));
                  }}
                  className={cn(
                    "relative flex min-h-13 items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-primary",
                    selected
                      ? "border-primary/55 bg-primary/5"
                      : "border-border/80",
                    correct && "border-primary bg-primary/7",
                    wrong && "border-destructive/50 bg-destructive/5",
                    disabled || locked
                      ? "cursor-default"
                      : "cursor-pointer hover:border-primary/30 hover:bg-secondary/40",
                  )}
                >
                  <input
                    type="radio"
                    className="peer sr-only"
                    name={`${examId}-${question.id}`}
                    value={index}
                    checked={selected}
                    onChange={() =>
                      markAnswer(
                        examId,
                        String(question.id),
                        index as AnswerIndex,
                      )
                    }
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full font-medium",
                      selected
                        ? "bg-primary text-white"
                        : "text-muted-foreground",
                      wrong && "bg-destructive text-white",
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
                    <span className="shrink-0 self-center text-xs font-semibold text-primary">
                      {selected ? "내 답 / 정답" : "정답"}
                    </span>
                  )}
                  {wrong && (
                    <span className="shrink-0 self-center text-xs font-semibold text-destructive">
                      내 답
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
      {solutionVisible && (
        <section
          id={`solution-${question.id}`}
          aria-live="polite"
          className="border-t border-primary/10 bg-primary/4 px-5 py-4 sm:px-8"
        >
          {!solution && solutionQuery.isFetching && (
            <p className="text-sm text-muted-foreground">
              정답과 해설을 불러오는 중
            </p>
          )}
          {!solution && solutionQuery.isError && (
            <p className="text-sm text-destructive">
              {solutionQuery.error.message}
            </p>
          )}
          {solution && (
            <div className="text-sm leading-7 text-foreground/80">
              <div className="flex gap-2">
                <Lightbulb className="mt-1 size-4 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold text-primary">해설</p>
                  {solution.explanation ? (
                    <p>{solution.explanation}</p>
                  ) : (
                    <p className="text-muted-foreground">
                      {solution.explanationStatus === "FAILED"
                        ? "해설을 불러오지 못했습니다."
                        : "해설을 준비하고 있습니다."}
                    </p>
                  )}
                </div>
              </div>
              {solution.choiceExplanations ? (
                <ol className="mt-3 space-y-2 text-muted-foreground">
                  {solution.choiceExplanations.map((explanation, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="shrink-0 text-primary">
                        {numerals[index]}
                      </span>
                      <span>{explanation}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          )}
        </section>
      )}
    </article>
  );
}
