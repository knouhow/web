"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { QuestionCard } from "./question-card";
import { FloatingIndexBar } from "./floating-index-bar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  examQueryKey,
  fetchExam,
  refreshPendingExplanations,
  scrollToQuestion,
  submitExam,
} from "@/lib/exam/client";
import type { Answers } from "@/lib/exam/types";
import { useExamStore } from "@/store/exam-store-provider";

const EMPTY_ANSWERS: Answers = {};

export function ExamViewerPage({ examId }: { examId: string }) {
  const hydrated = useExamStore((state) => state.hydrated);
  const storageError = useExamStore((state) => state.storageError);
  const session = useExamStore((state) => state.sessions[examId]);
  const setResult = useExamStore((state) => state.setResult);
  const resetExam = useExamStore((state) => state.resetExam);
  const { error: showError, success } = useToast();
  const answers = session?.answers ?? EMPTY_ANSWERS;
  const result = session?.result;
  const [activeQuestionId, setActiveQuestionId] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const appliedExplanationResultRef = useRef<typeof result>(undefined);

  const examQuery = useQuery({
    queryKey: examQueryKey(examId),
    queryFn: ({ signal }) => fetchExam(examId, signal),
  });
  const exam = examQuery.data;
  const grade = useMutation({
    mutationFn: (snapshot: Answers) => {
      if (!exam) throw new Error("시험을 불러오지 못했습니다.");
      return submitExam(exam, snapshot);
    },
    onSuccess: (data) => {
      setResult(examId, data);
      success({ title: "채점이 완료되었습니다." });
    },
    onError: (mutationError) => {
      showError({
        title: "채점하지 못했습니다.",
        description: mutationError.message,
      });
    },
  });
  const pendingExplanationQuery = useQuery({
    queryKey: ["exam-explanations", examId, JSON.stringify(answers)],
    queryFn: ({ signal }) => {
      if (!exam || !result) throw new Error("채점 결과를 불러오지 못했습니다.");
      return refreshPendingExplanations(exam, answers, result, signal);
    },
    enabled: Boolean(
      exam &&
      result &&
      Object.values(result.questions).some(
        ({ explanationStatus }) =>
          explanationStatus === "REQUESTED" ||
          explanationStatus === "GENERATING",
      ),
    ),
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (
      pendingExplanationQuery.data &&
      result &&
      appliedExplanationResultRef.current !== pendingExplanationQuery.data
    ) {
      appliedExplanationResultRef.current = pendingExplanationQuery.data;
      setResult(examId, pendingExplanationQuery.data);
    }
  }, [examId, pendingExplanationQuery.data, result, setResult]);

  useEffect(() => {
    if (!exam) return;
    const visible = new Map<string, Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.target);
          else visible.delete(entry.target.id);
        }
        const nearest = [...visible.values()].sort(
          (a, b) =>
            Math.abs(a.getBoundingClientRect().top - 96) -
            Math.abs(b.getBoundingClientRect().top - 96),
        )[0];
        if (nearest)
          setActiveQuestionId(
            nearest.getAttribute("data-question-id") ??
              String(exam.questions[0]?.id ?? ""),
          );
      },
      { rootMargin: "-88px 0px -40% 0px", threshold: [0, 0.25, 0.5] },
    );
    document
      .querySelectorAll("[data-question-id]")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [exam]);

  useEffect(() => {
    if (!result) return;
    resultRef.current?.focus({ preventScroll: true });
    resultRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  }, [result]);

  if (!exam) {
    return (
      <main
        id="main-content"
        className="mx-auto min-h-72 max-w-3xl px-4 py-12 sm:px-8"
      >
        {examQuery.isError ? (
          <div role="alert" className="rounded-2xl border border-border p-5">
            <p className="font-semibold">시험을 불러오지 못했습니다.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {examQuery.error.message}
            </p>
            <Button
              type="button"
              variant="link"
              className="mt-3 h-auto p-0"
              onClick={() => void examQuery.refetch()}
            >
              다시 시도
            </Button>
          </div>
        ) : (
          <p role="status" className="text-sm text-muted-foreground">
            시험을 불러오는 중입니다.
          </p>
        )}
      </main>
    );
  }

  function handleSubmit() {
    if (!hydrated || grade.isPending) return;
    grade.mutate({ ...answers });
  }

  const answeredCount = exam.questions.filter(
    (question) => answers[String(question.id)] !== undefined,
  ).length;
  const subjectCatalogHref = exam.subjectCode
    ? `/#subject-${encodeURIComponent(exam.subjectCode)}`
    : "/";
  const backHref = exam.kind === "tech" ? "/mixer" : subjectCatalogHref;

  return (
    <main
      id="main-content"
      className="mx-auto max-w-7xl px-4 pt-7 pb-64 sm:px-8 lg:pt-9 lg:pr-84 lg:pb-20"
    >
      <div className="mb-7 flex items-center gap-2 text-xs text-foreground">
        <Link href={backHref} className="hover:text-primary">
          {exam.kind === "tech" ? "학습" : "기출문제"}
        </Link>
        <ChevronRight className="size-3" />
        {exam.kind === "university" ? (
          <>
            <span>{exam.title}</span>
            <span>{exam.examYear}년 기출문제</span>
          </>
        ) : (
          <span>{exam.title}</span>
        )}
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        문제 {answeredCount}개 / 전체 {exam.questions.length}문제
      </div>
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
      >
        <ArrowLeft className="size-4" />
        뒤로가기
      </Link>
      {storageError && (
        <p
          role="alert"
          className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
        >
          브라우저 저장소를 사용할 수 없어 새로고침하면 답안이 사라질 수 있어요.
        </p>
      )}
      {result && (
        <div
          ref={resultRef}
          tabIndex={-1}
          role="status"
          className="mb-6 scroll-mt-24 rounded-2xl bg-primary px-6 py-6 text-white outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">
              {result.answeredCount}문제 중 {result.correctCount}문제 정답
            </h2>
            <p className="font-mono text-4xl font-semibold">
              {result.score}
              <span className="ml-1 text-sm">점</span>
            </p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {exam.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            exam={exam}
            examId={examId}
            question={question}
            number={index + 1}
            answers={answers}
            result={result?.questions[String(question.id)]}
            disabled={!hydrated || grade.isPending}
          />
        ))}
      </div>

      <FloatingIndexBar
        questions={exam.questions}
        answers={answers}
        activeQuestionId={
          activeQuestionId || String(exam.questions[0]?.id ?? "")
        }
        result={result}
        isPending={grade.isPending}
        disabled={!hydrated}
        onSubmit={handleSubmit}
        onReset={() => setResetOpen(true)}
      />
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>시험을 다시 풀까요?</AlertDialogTitle>
            <AlertDialogDescription>
              현재 시험의 답안과 채점 결과를 지우고 처음부터 시작합니다. 다른
              시험의 답안은 유지됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetExam(examId);
                grade.reset();
                scrollToQuestion(exam.questions[0].id);
              }}
            >
              다시 풀기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
