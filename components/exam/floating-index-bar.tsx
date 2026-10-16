"use client";

import { useState } from "react";
import { ChevronDown, Grid2X2, LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { scrollToQuestion } from "@/lib/exam/client";
import {
  isAnswerForChoiceCount,
  type AnswerIndex,
  type Answers,
  type GradeResult,
  type Question,
} from "@/lib/exam/types";

function getQuestionStatus(
  grade: GradeResult["questions"][string] | undefined,
  answered: boolean,
) {
  if (!grade) return answered ? "푼 문제" : "안 푼 문제";
  if (!grade.isAnswered) return "안 푼 문제";
  return grade.isCorrect ? "정답" : "오답";
}

function SubmitButtonContent({
  isPending,
  hasResult,
}: Readonly<{ isPending: boolean; hasResult: boolean }>) {
  if (isPending)
    return (
      <>
        <LoaderCircle className="animate-spin" />
        채점 중
      </>
    );
  if (hasResult)
    return (
      <>
        <RotateCcw />
        다시 풀기
      </>
    );
  return "채점하기";
}

interface FloatingIndexBarProps {
  readonly questions: Question[];
  readonly answers: Answers;
  readonly activeQuestionId: string;
  readonly result?: GradeResult;
  readonly lockedQuestionIds: ReadonlySet<number>;
  readonly onAnswerChange: (
    questionId: number,
    answer: AnswerIndex | null,
  ) => void;
  readonly isPending: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: () => void;
  readonly onReset: () => void;
}

export function FloatingIndexBar({
  questions,
  answers,
  activeQuestionId,
  result,
  lockedQuestionIds,
  onAnswerChange,
  isPending,
  disabled,
  onSubmit,
  onReset,
}: FloatingIndexBarProps) {
  const [expanded, setExpanded] = useState(false);
  const answeredCount = questions.filter((question) =>
    isAnswerForChoiceCount(
      answers[String(question.id)],
      question.choices.length,
    ),
  ).length;

  return (
    <aside
      aria-label="답안지"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/98 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_#18392e09] backdrop-blur-xl lg:inset-x-auto lg:top-36 lg:right-[max(2rem,calc((100vw-1216px)/2))] lg:bottom-auto lg:max-h-[calc(100dvh-9rem)] lg:w-68 lg:overflow-y-auto lg:rounded-2xl lg:border lg:p-6 lg:shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between lg:mb-5">
        <h2 className="text-sm font-bold lg:text-base">답안지</h2>
        <span className="flex items-baseline gap-1 font-mono text-sm">
          <strong className="text-primary">
            {String(answeredCount).padStart(2, "0")}
          </strong>
          <span className="text-muted-foreground">/ {questions.length}</span>
        </span>
      </div>
      <Progress
        value={(answeredCount / questions.length) * 100}
        aria-label="문제 풀이 진행률"
        className="mb-4 h-1.5"
      />
      <div
        className={cn(
          "-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pt-1 pb-2 lg:mx-0 lg:mb-5 lg:grid lg:grid-cols-3 lg:gap-2 lg:overflow-visible lg:p-0",
          expanded &&
            "grid max-h-[42dvh] grid-cols-4 overflow-y-auto lg:grid-cols-3",
        )}
      >
        {questions.map((question, index) => {
          const answer = answers[String(question.id)];
          const answered = isAnswerForChoiceCount(
            answer,
            question.choices.length,
          );
          const grade = result?.questions[String(question.id)];
          const status = getQuestionStatus(grade, answered);
          const active = activeQuestionId === String(question.id);
          const locked =
            disabled ||
            isPending ||
            Boolean(result) ||
            lockedQuestionIds.has(question.id);
          return (
            <div
              key={question.id}
              className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1 rounded-lg p-1 lg:w-auto"
            >
              <button
                type="button"
                aria-label={`${index + 1}번 ${status}`}
                aria-current={active ? "location" : undefined}
                onClick={() => {
                  setExpanded(false);
                  scrollToQuestion(question.id);
                }}
                className={cn(
                  "flex h-8 w-full items-center justify-center rounded-lg border text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  answered
                    ? "border-primary/20 bg-primary/9 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40",
                  grade &&
                    grade.isAnswered &&
                    !grade.isCorrect &&
                    "border-destructive/20 bg-destructive/7 text-destructive",
                  active && "ring-2 ring-primary ring-offset-2",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </button>
              <fieldset className="grid min-w-0 grid-cols-2 gap-0.5 border-0 p-0">
                <legend className="sr-only">{index + 1}번 문제 답안</legend>
                {question.choices.map((choice, choiceIndex) => {
                  const selected = answered && answer === choiceIndex;
                  const occurrence = question.choices
                    .slice(0, choiceIndex)
                    .filter(
                      (previousChoice) => previousChoice === choice,
                    ).length;
                  const label =
                    question.type === "TRUE_FALSE"
                      ? choice
                      : `선지 ${choiceIndex + 1}`;
                  return (
                    <button
                      key={`${question.id}-${choice}-${occurrence}`}
                      type="button"
                      aria-label={`${index + 1}번 문제 ${label} 선택`}
                      aria-pressed={selected}
                      disabled={locked}
                      onClick={() =>
                        onAnswerChange(
                          question.id,
                          selected ? null : (choiceIndex as AnswerIndex),
                        )
                      }
                      className={cn(
                        "grid size-6 place-items-center rounded-full border text-[10px] leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-default",
                        selected
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50",
                        grade &&
                          grade.isAnswered &&
                          selected &&
                          !grade.isCorrect &&
                          "border-destructive bg-destructive text-white",
                      )}
                    >
                      {question.type === "TRUE_FALSE"
                        ? choice
                        : choiceIndex + 1}
                    </button>
                  );
                })}
              </fieldset>
            </div>
          );
        })}
      </div>
      <div className="mb-5 hidden items-center gap-4 text-[11px] text-muted-foreground lg:flex">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-sm border border-border"
          />
          <span>안 푼 문제</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-sm bg-primary" />
          <span>푼 문제</span>
        </span>
        {result && (
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-sm bg-destructive" />
            <span>오답</span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 lg:block">
        <Button
          variant="outline"
          className="h-11 shrink-0 text-xs lg:hidden"
          aria-expanded={expanded}
          aria-label={expanded ? "문제 번호 접기" : "전체 문제 번호 펼치기"}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown /> : <Grid2X2 />}
          <span className="hidden min-[400px]:inline">전체 번호</span>
        </Button>
        <Button
          className="h-11 flex-1 rounded-lg text-sm lg:w-full"
          disabled={disabled || isPending}
          onClick={result ? onReset : onSubmit}
        >
          <SubmitButtonContent
            isPending={isPending}
            hasResult={Boolean(result)}
          />
        </Button>
      </div>
    </aside>
  );
}
