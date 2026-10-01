"use client";

import { useState } from "react";
import { ChevronDown, Grid2X2, LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { scrollToQuestion } from "@/lib/exam/client";
import type { Answers, GradeResult, Question } from "@/lib/exam/types";

interface FloatingIndexBarProps {
  questions: Question[];
  answers: Answers;
  activeQuestionId: string;
  result?: GradeResult;
  isPending: boolean;
  disabled?: boolean;
  onSubmit: () => void;
  onReset: () => void;
}

export function FloatingIndexBar({
  questions,
  answers,
  activeQuestionId,
  result,
  isPending,
  disabled,
  onSubmit,
  onReset,
}: FloatingIndexBarProps) {
  const [expanded, setExpanded] = useState(false);
  const answeredCount = questions.filter(
    (question) => answers[String(question.id)] !== undefined,
  ).length;

  return (
    <aside
      aria-label="답안지"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/98 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_#18392e09] backdrop-blur-xl lg:inset-x-auto lg:top-36 lg:right-[max(2rem,calc((100vw-1216px)/2))] lg:bottom-auto lg:w-68 lg:rounded-2xl lg:border lg:p-6 lg:shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between lg:mb-5">
        <h2 className="text-sm font-bold lg:text-base">답안지</h2>
        <span className="font-mono text-sm">
          <strong className="text-primary">
            {String(answeredCount).padStart(2, "0")}
          </strong>
          <span className="text-muted-foreground"> / {questions.length}</span>
        </span>
      </div>
      <Progress
        value={(answeredCount / questions.length) * 100}
        aria-label="문제 풀이 진행률"
        className="mb-4 h-1.5"
      />
      <div
        className={cn(
          "-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pt-1 pb-2 lg:mx-0 lg:mb-5 lg:grid lg:grid-cols-5 lg:gap-2 lg:overflow-visible lg:p-0",
          expanded && "grid max-h-[42dvh] grid-cols-5 overflow-y-auto",
        )}
      >
        {questions.map((question, index) => {
          const answered = answers[String(question.id)] !== undefined;
          const grade = result?.questions[String(question.id)];
          const status = grade
            ? grade.isAnswered
              ? grade.isCorrect
                ? "정답"
                : "오답"
              : "안 푼 문제"
            : answered
              ? "푼 문제"
              : "안 푼 문제";
          const active = activeQuestionId === String(question.id);
          return (
            <button
              key={question.id}
              type="button"
              aria-label={`${index + 1}번 ${status}`}
              aria-current={active ? "location" : undefined}
              onClick={() => {
                setExpanded(false);
                scrollToQuestion(question.id);
              }}
              className={cn(
                "relative flex size-11 shrink-0 items-center justify-center rounded-lg border text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:h-10 lg:w-full",
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
          );
        })}
      </div>
      <div className="mb-5 hidden items-center gap-4 text-[11px] text-muted-foreground lg:flex">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm border border-border" />안 푼
          문제
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-primary" />푼 문제
        </span>
        {result && (
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-sm bg-destructive" />
            오답
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
          {isPending ? (
            <>
              <LoaderCircle className="animate-spin" />
              채점 중
            </>
          ) : result ? (
            <>
              <RotateCcw />
              다시 풀기
            </>
          ) : (
            "채점하기"
          )}
        </Button>
      </div>
    </aside>
  );
}
