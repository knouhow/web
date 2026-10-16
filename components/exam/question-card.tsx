"use client";

import { useState, type SubmitEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Flag, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/toast-provider";
import {
  EXPLANATION_POLL_INTERVAL_MS,
  fetchQuestionSolution,
  questionSolutionQueryKey,
  retryQuestionExplanation,
  submitQuestionReport,
} from "@/lib/exam/client";
import {
  isAnswerForChoiceCount,
  QUESTION_REPORT_TYPES,
  type AnswerIndex,
  type Question,
  type QuestionReportType,
  type QuestionResult,
  type QuestionSolution,
} from "@/lib/exam/types";
import { useExamStore } from "@/store/exam-store-provider";
import { cn } from "@/lib/utils";
import { RichContent } from "./rich-content";

const numerals = ["①", "②", "③", "④"] as const;

function getExplanationMessage(status: QuestionResult["explanationStatus"] | undefined) {
  if (status === "FAILED") return "해설을 불러오지 못했습니다.";
  if (status === "REQUESTED" || status === "GENERATING")
    return "해설을 준비하고 있습니다.";
  return null;
}

function getChoiceAccessibleName(
  number: number,
  question: Question,
  choice: string,
  index: number,
) {
  const choiceLabel =
    question.type === "TRUE_FALSE" ? choice : `${index + 1}번 선지`;
  return `${number}번 문제 ${choiceLabel}`;
}

function getChoiceMarker(
  question: Question,
  choice: string,
  index: number,
  selected: boolean,
  correct: boolean,
) {
  if (question.type === "TRUE_FALSE") return choice;
  if (selected || correct) return index + 1;
  return numerals[index];
}

interface QuestionChoicesProps {
  readonly examId: string;
  readonly question: Question;
  readonly number: number;
  readonly answer?: AnswerIndex;
  readonly solutionVisible: boolean;
  readonly correctAnswer?: AnswerIndex;
  readonly disabled: boolean;
  readonly locked: boolean;
  readonly onAnswerChange: (
    questionId: number,
    answer: AnswerIndex | null,
  ) => void;
}

function QuestionChoices({
  examId,
  question,
  number,
  answer,
  solutionVisible,
  correctAnswer,
  disabled,
  locked,
  onAnswerChange,
}: QuestionChoicesProps) {
  const questionLabelId = `question-label-${question.id}`;
  const keyOccurrences = new Map<string, number>();

  return (
    <fieldset
      aria-describedby={questionLabelId}
      className="min-w-0 border-0 p-0"
    >
      <legend className="sr-only">{number}번 문제 답안</legend>
      <div
        id={questionLabelId}
        className="mb-5 text-[16px] leading-relaxed font-semibold sm:text-lg"
      >
        <RichContent
          content={question.text}
          images={question.images}
          tables={question.tables}
        />
      </div>
      <div className="space-y-2.5">
        {question.choices.map((choice, index) => {
          const occurrence = keyOccurrences.get(choice) ?? 0;
          keyOccurrences.set(choice, occurrence + 1);
          const selected = answer === index;
          const correct = solutionVisible && correctAnswer === index;
          const wrong = solutionVisible && selected && !correct;
          const inputId = `choice-${examId}-${question.id}-${index}`;
          const choiceName = getChoiceAccessibleName(
            number,
            question,
            choice,
            index,
          );
          const marker = getChoiceMarker(
            question,
            choice,
            index,
            selected,
            correct,
          );

          return (
            <div
              key={`${question.id}-${choice}-${occurrence}`}
              className={cn(
                "relative flex min-h-13 items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary",
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
                id={inputId}
                disabled={disabled || locked}
                value={index}
                checked={selected}
                onClick={(event) => {
                  if (!selected) return;
                  event.preventDefault();
                  onAnswerChange(question.id, null);
                }}
                onChange={() =>
                  onAnswerChange(
                    question.id,
                    index as AnswerIndex,
                  )
                }
              />
              <label
                htmlFor={inputId}
                className={cn(
                  "absolute inset-0 z-0 rounded-xl",
                  disabled || locked ? "cursor-default" : "cursor-pointer",
                )}
              >
                <span className="sr-only">{choiceName}</span>
              </label>
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none relative z-10 grid shrink-0 place-items-center",
                  question.type === "TRUE_FALSE"
                    ? "size-11 rounded-xl border text-base font-bold sm:size-12"
                    : "size-6 rounded-full font-medium",
                  selected ? "bg-primary text-white" : "text-muted-foreground",
                  wrong && "bg-destructive text-white",
                  correct && "bg-primary text-white",
                )}
              >
                {marker}
              </span>
              <span
                className={cn(
                  "pointer-events-none relative z-10 min-w-0 flex-1",
                  selected && "font-medium",
                )}
              >
                {question.type === "MULTIPLE_CHOICE" && (
                  <RichContent
                    content={choice}
                    images={question.images}
                    tables={question.tables}
                    className="pointer-events-none"
                  />
                )}
              </span>
              {correct && (
                <span className="pointer-events-none relative z-10 shrink-0 self-center text-xs font-semibold text-primary">
                  {selected ? "내 답 / 정답" : "정답"}
                </span>
              )}
              {wrong && (
                <span className="pointer-events-none relative z-10 shrink-0 self-center text-xs font-semibold text-destructive">
                  내 답
                </span>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

interface QuestionSolutionContentProps {
  readonly question: Question;
  readonly solution: QuestionSolution;
}

function QuestionSolutionContent({
  question,
  solution,
}: QuestionSolutionContentProps) {
  const explanationMessage = getExplanationMessage(solution.explanationStatus);
  const explanationKeyOccurrences = new Map<string, number>();

  return (
    <div className="text-sm leading-7 text-foreground/80">
      <div className="flex gap-2">
        <Lightbulb className="mt-1 size-4 shrink-0 text-primary" />
        <div>
          <p className="font-semibold text-primary">해설</p>
          {solution.explanation && (
            <RichContent
              content={solution.explanation}
              images={question.images}
              tables={question.tables}
            />
          )}
          {explanationMessage && (
            <p className="text-muted-foreground">{explanationMessage}</p>
          )}
        </div>
      </div>
      {solution.choiceExplanations && (
        <ol className="mt-3 space-y-2 text-muted-foreground">
          {solution.choiceExplanations.map((choiceExplanation, index) => {
            const choice = question.choices[index] ?? "choice";
            const occurrence = explanationKeyOccurrences.get(choice) ?? 0;
            explanationKeyOccurrences.set(choice, occurrence + 1);
            return (
              <li
                key={`${question.id}-${choice}-${occurrence}-explanation`}
                className="flex gap-2"
              >
                <span className="shrink-0 text-primary">{numerals[index]}</span>
                <RichContent
                  content={choiceExplanation}
                  images={question.images}
                  tables={question.tables}
                />
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

interface QuestionSolutionPanelProps {
  readonly question: Question;
  readonly visible: boolean;
  readonly solution?: QuestionSolution;
  readonly isFetching: boolean;
  readonly errorMessage?: string;
  readonly showRetry: boolean;
  readonly retrying: boolean;
  readonly retryError: string | null;
  readonly onRetry: () => void;
}

function QuestionSolutionPanel({
  question,
  visible,
  solution,
  isFetching,
  errorMessage,
  showRetry,
  retrying,
  retryError,
  onRetry,
}: QuestionSolutionPanelProps) {
  if (!visible) return null;
  if (
    solution &&
    !solution.explanation &&
    solution.explanationStatus === "NONE" &&
    !solution.choiceExplanations
  )
    return null;

  return (
    <section
      id={`solution-${question.id}`}
      aria-live="polite"
      className="border-t border-primary/10 bg-primary/4 px-5 py-4 sm:px-8"
    >
      {!solution && isFetching && (
        <p className="text-sm text-muted-foreground">
          정답과 해설을 불러오는 중
        </p>
      )}
      {!solution && errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
      {solution && (
        <QuestionSolutionContent question={question} solution={solution} />
      )}
      {showRetry && (
        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={retrying}
            onClick={onRetry}
          >
            {retrying ? "다시 요청 중" : "해설 다시 요청"}
          </Button>
          {retryError && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {retryError}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

interface QuestionReportDialogProps {
  readonly question: Question;
  readonly number: number;
}

function QuestionReportDialog({
  question,
  number,
}: QuestionReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<QuestionReportType | null>(null);
  const [content, setContent] = useState("");
  const { error: showError, success } = useToast();
  const reportMutation = useMutation({
    mutationFn: (report: Readonly<{ type: QuestionReportType; content: string }>) =>
      submitQuestionReport(question.id, report.type, report.content),
    onSuccess: () => {
      setOpen(false);
      setType(null);
      setContent("");
      success({ title: "신고가 접수되었습니다." });
    },
    onError: (reportError) => {
      showError({
        title: "신고를 접수하지 못했습니다.",
        description:
          reportError instanceof Error
            ? reportError.message
            : "잠시 후 다시 시도해 주세요.",
      });
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && reportMutation.isPending) return;
    setOpen(nextOpen);
    if (nextOpen) return;
    setType(null);
    setContent("");
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!type || reportMutation.isPending) return;
    reportMutation.mutate({ type, content });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={`${number}번 문항 신고`}
        onClick={() => setOpen(true)}
      >
        <Flag aria-hidden="true" />
        신고
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          aria-describedby={`question-report-description-${question.id}`}
          className="max-h-[90dvh] overflow-y-auto sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>문항 신고</DialogTitle>
            <p
              id={`question-report-description-${question.id}`}
              className="pr-5 text-sm leading-6 text-muted-foreground"
            >
              신고 내용은 문항 검수에 사용합니다. 처리 결과는 별도로 안내하지
              않습니다.
            </p>
          </DialogHeader>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">신고 종류</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {QUESTION_REPORT_TYPES.map((option, index) => (
                  <label
                    key={option.value}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <input
                      type="radio"
                      name={`question-report-type-${question.id}`}
                      value={option.value}
                      checked={type === option.value}
                      onChange={() => setType(option.value)}
                      required={index === 0}
                      disabled={reportMutation.isPending}
                      className="size-4 accent-primary"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="space-y-2">
              <label
                htmlFor={`question-report-content-${question.id}`}
                className="flex items-center gap-1 text-sm font-semibold"
              >
                <span>설명</span>
                <span className="font-normal text-muted-foreground">(선택)</span>
              </label>
              <textarea
                id={`question-report-content-${question.id}`}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="문항에서 발견한 문제를 적어 주세요."
                maxLength={1000}
                rows={4}
                disabled={reportMutation.isPending}
                className="w-full resize-y rounded-xl border border-input bg-transparent px-3 py-2 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <p className="text-right text-xs text-muted-foreground">
                {content.length} / 1000
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={reportMutation.isPending}
                onClick={() => handleOpenChange(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={!type || reportMutation.isPending}>
                {reportMutation.isPending ? "접수 중" : "신고하기"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface QuestionCardProps {
  readonly examId: string;
  readonly question: Question;
  readonly number: number;
  readonly result?: QuestionResult;
  readonly disabled?: boolean;
  readonly onSolutionOpenChange?: (
    questionId: number,
    open: boolean,
  ) => void;
}

export function QuestionCard({
  examId,
  question,
  number,
  result,
  disabled,
  onSolutionOpenChange,
}: QuestionCardProps) {
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [retryingExplanation, setRetryingExplanation] = useState(false);
  const [retryExplanationError, setRetryExplanationError] = useState<
    string | null
  >(null);
  const answer = useExamStore(
    (state) => state.sessions[examId]?.answers[String(question.id)],
  );
  const markAnswer = useExamStore((state) => state.markAnswer);
  const clearAnswer = useExamStore((state) => state.clearAnswer);
  const solutionQuery = useQuery({
    queryKey: questionSolutionQueryKey(examId, question.id),
    queryFn: ({ signal }) => fetchQuestionSolution(question, signal),
    enabled: solutionOpen && !result,
    refetchInterval: (query) =>
      query.state.data?.explanationStatus === "REQUESTED" ||
      query.state.data?.explanationStatus === "GENERATING"
        ? EXPLANATION_POLL_INTERVAL_MS
        : false,
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
      onSolutionOpenChange?.(question.id, false);
      return;
    }
    setSolutionOpen(true);
    onSolutionOpenChange?.(question.id, true);
  }

  async function handleRetryExplanation() {
    setRetryingExplanation(true);
    setRetryExplanationError(null);
    try {
      await retryQuestionExplanation(question.id);
      await solutionQuery.refetch({ throwOnError: true });
    } catch (retryError) {
      setRetryExplanationError(
        retryError instanceof Error
          ? retryError.message
          : "해설을 다시 요청하지 못했습니다.",
      );
    } finally {
      setRetryingExplanation(false);
    }
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
          <div className="flex items-center gap-2">
            <QuestionReportDialog question={question} number={number} />
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
        </div>
        <QuestionChoices
          examId={examId}
          question={question}
          number={number}
          answer={isAnswerForChoiceCount(answer, question.choices.length) ? answer : undefined}
          solutionVisible={solutionVisible}
          correctAnswer={solution?.correctAnswer}
          disabled={Boolean(disabled)}
          locked={locked}
          onAnswerChange={(questionId, nextAnswer) =>
            nextAnswer === null
              ? clearAnswer(examId, String(questionId))
              : markAnswer(examId, String(questionId), nextAnswer)
          }
        />
      </div>
      <QuestionSolutionPanel
        question={question}
        visible={solutionVisible}
        solution={solution}
        isFetching={solutionQuery.isFetching}
        errorMessage={solutionQuery.isError ? solutionQuery.error.message : undefined}
        showRetry={solution?.explanationStatus === "FAILED" && !result}
        retrying={retryingExplanation}
        retryError={retryExplanationError}
        onRetry={handleRetryExplanation}
      />
    </article>
  );
}
