"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { QuestionCard } from "./question-card";
import { FloatingIndexBar } from "./floating-index-bar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast-provider";
import { ApiError } from "@/lib/api-client";
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
import { isAnswerForChoiceCount } from "@/lib/exam/types";
import { useExamStore } from "@/store/exam-store-provider";

const EMPTY_ANSWERS: Answers = {};

export function ExamViewerPage({ examId }: Readonly<{ examId: string }>) {
  const { user: authUser, hydrated: authHydrated } = useAuth();
  const hydrated = useExamStore((state) => state.hydrated);
  const storageError = useExamStore((state) => state.storageError);
  const session = useExamStore((state) => state.sessions[examId]);
  const setResult = useExamStore((state) => state.setResult);
  const resetExam = useExamStore((state) => state.resetExam);
  const markAnswer = useExamStore((state) => state.markAnswer);
  const clearAnswer = useExamStore((state) => state.clearAnswer);
  const { error: showError, success } = useToast();
  const answers = session?.answers ?? EMPTY_ANSWERS;
  const result = session?.result;
  const [activeQuestionId, setActiveQuestionId] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingGradeAnswers, setPendingGradeAnswers] =
    useState<Answers | null>(null);
  const [solutionLockedIds, setSolutionLockedIds] = useState<Set<number>>(
    () => new Set(),
  );
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
    onError: (mutationError, snapshot) => {
      if (
        exam?.kind === "university" &&
        mutationError instanceof ApiError &&
        mutationError.status === 401 &&
        mutationError.code === "AUTH_001"
      ) {
        setPendingGradeAnswers({ ...snapshot });
        setLoginOpen(true);
        return;
      }
      showError({
        title: "채점하지 못했습니다.",
        description: mutationError.message,
      });
    },
  });
  const pendingExplanationQuery = useQuery({
    queryKey: ["exam-explanations", examId, result],
    queryFn: ({ signal }) => {
      if (!exam || !result) throw new Error("채점 결과를 불러오지 못했습니다.");
      return refreshPendingExplanations(exam, result, signal);
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
        if (nearest instanceof HTMLElement)
          setActiveQuestionId(
            nearest.dataset.questionId ?? String(exam.questions[0]?.id ?? ""),
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
              onClick={async () => {
                await examQuery.refetch();
              }}
            >
              다시 시도
            </Button>
          </div>
        ) : (
          <output
            aria-live="polite"
            className="block text-sm text-muted-foreground"
          >
            시험을 불러오는 중입니다.
          </output>
        )}
      </main>
    );
  }

  function handleSubmit() {
    if (!exam || !hydrated || grade.isPending) return;
    const snapshot = { ...answers };
    if (exam.kind === "university" && authHydrated && !authUser) {
      setPendingGradeAnswers(snapshot);
      setLoginOpen(true);
      return;
    }
    grade.mutate(snapshot);
  }

  function continueGradeAfterLogin() {
    if (!pendingGradeAnswers || grade.isPending) return;
    const snapshot = { ...pendingGradeAnswers };
    setPendingGradeAnswers(null);
    grade.mutate(snapshot);
  }

  const answeredCount = exam.questions.filter((question) =>
    isAnswerForChoiceCount(
      answers[String(question.id)],
      question.choices.length,
    ),
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
          <span>{`${exam.title} · ${exam.examYear}년 기출문제`}</span>
        ) : (
          <span>{exam.title}</span>
        )}
      </div>
      <output aria-live="polite" className="sr-only">
        문제 {answeredCount}개 / 전체 {exam.questions.length}문제
      </output>
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
        <section
          ref={resultRef}
          tabIndex={-1}
          aria-live="polite"
          className="mb-6 scroll-mt-24 rounded-2xl bg-primary px-6 py-6 text-white outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">
              {result.answeredCount}문제 중 {result.correctCount}문제 정답
            </h2>
            <output className="flex items-baseline gap-1 font-mono text-4xl font-semibold">
              <span>{result.score}</span>
              <span className="text-sm">/ {result.maxScore}점</span>
            </output>
          </div>
        </section>
      )}

      <div className="space-y-5">
        {exam.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            examId={examId}
            question={question}
            number={index + 1}
            result={result?.questions[String(question.id)]}
            disabled={!hydrated || grade.isPending}
            onSolutionOpenChange={(questionId, open) =>
              setSolutionLockedIds((current) => {
                const next = new Set(current);
                if (open) next.add(questionId);
                else next.delete(questionId);
                return next;
              })
            }
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
        lockedQuestionIds={solutionLockedIds}
        onAnswerChange={(questionId, answer) =>
          answer === null
            ? clearAnswer(examId, String(questionId))
            : markAnswer(examId, String(questionId), answer)
        }
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
                setSolutionLockedIds(new Set());
                grade.reset();
                scrollToQuestion(exam.questions[0].id);
              }}
            >
              다시 풀기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSignedIn={continueGradeAfterLogin}
      />
    </main>
  );
}
