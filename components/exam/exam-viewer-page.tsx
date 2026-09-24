"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  FileText,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { QuestionCard } from "./question-card";
import { FloatingIndexBar } from "./floating-index-bar";
import { Button } from "@/components/ui/button";
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
  scrollToQuestion,
  submitExam,
} from "@/lib/exam/client";
import type { Answers, Exam } from "@/lib/exam/types";
import { useExamStore } from "@/store/exam-store-provider";

const EMPTY_ANSWERS: Answers = {};

export function ExamViewerPage({
  examId,
  initialExam,
}: {
  examId: string;
  initialExam: Exam;
}) {
  const hydrated = useExamStore((state) => state.hydrated);
  const storageError = useExamStore((state) => state.storageError);
  const session = useExamStore((state) => state.sessions[examId]);
  const setResult = useExamStore((state) => state.setResult);
  const resetExam = useExamStore((state) => state.resetExam);
  const answers = session?.answers ?? EMPTY_ANSWERS;
  const result = session?.result;
  const [activeQuestionId, setActiveQuestionId] = useState(
    initialExam.questions[0].id,
  );
  const [showIncompleteNotice, setShowIncompleteNotice] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const {
    data: exam,
    isError,
    refetch,
  } = useQuery({
    queryKey: examQueryKey(examId),
    queryFn: ({ signal }) => fetchExam(examId, signal),
    initialData: initialExam,
  });
  const grade = useMutation({
    mutationFn: (snapshot: Answers) => submitExam(examId, snapshot),
    onSuccess: (data) => {
      setResult(examId, data);
      setShowIncompleteNotice(false);
    },
  });

  // viewport 상단에 가장 가까운 보이는 문항을 현재 OMR 위치로 표시한다.
  useEffect(() => {
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
            nearest.getAttribute("data-question-id") ?? exam.questions[0].id,
          );
      },
      { rootMargin: "-88px 0px -40% 0px", threshold: [0, 0.25, 0.5] },
    );
    document
      .querySelectorAll("[data-question-id]")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [exam.questions]);

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

  function handleSubmit() {
    if (!hydrated || grade.isPending || result) return;
    const missing = exam.questions.filter(
      (question) => answers[question.id] === undefined,
    );
    if (missing.length) {
      setShowIncompleteNotice(true);
      scrollToQuestion(missing[0].id);
      return;
    }
    setShowIncompleteNotice(false);
    grade.mutate({ ...answers });
  }

  const answeredCount = exam.questions.filter(
    (question) => answers[question.id] !== undefined,
  ).length;
  return (
    <main
      id="main-content"
      className="mx-auto max-w-7xl px-4 pt-7 pb-64 sm:px-8 lg:pt-9 lg:pr-84 lg:pb-20"
    >
      <div className="mb-7 flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href={exam.kind === "tech" ? "/mixer" : "/"}
          className="hover:text-primary"
        >
          {exam.kind === "tech" ? "기술 모의고사" : "방송대 기말고사"}
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-foreground">{exam.title}</span>
      </div>
      <section className="relative mb-8 overflow-hidden rounded-2xl border border-primary/10 bg-[#eaf1ec] px-6 py-7 sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-8 -right-8 size-52 rounded-full border-[32px] border-white/30"
        />
        <div className="relative">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-primary px-2.5 py-1 text-[10px] font-bold tracking-wide text-white">
              {exam.kind === "tech" ? "TECH PRACTICE" : "FINAL EXAM"}
            </span>
            <span className="text-xs font-medium text-primary">
              {exam.kind === "tech"
                ? "선택한 기술로 만드는 실전 연습"
                : "방송대 기말고사 대비"}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {exam.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-foreground/65">
            익숙한 시험지처럼, 내 속도에 맞춰 풀어보세요.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-foreground/75">
            <span className="flex items-center gap-1.5">
              <FileText className="size-3.5" />총 25문제
            </span>
            <span className="flex items-center gap-1.5">
              <Layers3 className="size-3.5" />
              객관식 4지선다
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" />
              문항당 4점
            </span>
          </div>
        </div>
      </section>

      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold">
            {result ? "풀이 결과" : "문제 풀기"}
          </h2>
          <span className="rounded-full border border-border bg-card px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            25 QUESTIONS
          </span>
        </div>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" />
          {!hydrated
            ? "답안 불러오는 중"
            : storageError
              ? "임시 저장 불가"
              : "브라우저 자동 저장"}
        </span>
      </div>
      <p className="mb-5 text-xs leading-5 text-muted-foreground">
        직접 작성한 샘플 문제입니다. 실제 기출문제와 AI 해설은 추후 제공됩니다.
      </p>
      <div role="status" aria-live="polite" className="sr-only">
        {answeredCount} / 25문제 응답 완료
      </div>
      {showIncompleteNotice && answeredCount < exam.questions.length && (
        <p
          role="alert"
          className="sticky top-20 z-20 mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {exam.questions.length - answeredCount}문제가 비어 있어요. 모든 문제에
          답한 뒤 채점할 수 있어요.
        </p>
      )}
      {storageError && (
        <p
          role="alert"
          className="mb-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
        >
          브라우저 저장소를 사용할 수 없어 새로고침하면 답안이 사라질 수 있어요.
        </p>
      )}
      {isError && (
        <div
          role="alert"
          className="mb-5 rounded-xl bg-destructive/5 p-4 text-sm"
        >
          시험을 새로 불러오지 못했어요.{" "}
          <Button variant="link" onClick={() => refetch()}>
            다시 시도
          </Button>
        </div>
      )}
      {grade.isError && (
        <p
          role="alert"
          className="sticky top-20 z-20 mb-5 rounded-xl border border-destructive/20 bg-card p-4 text-sm text-destructive"
        >
          {grade.error.message} 답안은 유지됩니다. 채점 버튼을 눌러 다시 시도해
          주세요.
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
            <div>
              <p className="mb-2 text-xs text-white/70">
                수고했어요. 오늘도 한 걸음 더!
              </p>
              <h2 className="text-xl font-bold">
                25문제 중 {result.correctCount}문제 정답
              </h2>
              <p className="mt-2 text-xs text-white/75">
                아래 해설로 배운 내용을 확인해 보세요.
              </p>
            </div>
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
            examId={examId}
            question={question}
            number={index + 1}
            result={result?.questions[question.id]}
            disabled={!hydrated || grade.isPending}
          />
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-border p-6 text-center">
        <span className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-primary/7 text-primary">
          <Check className="size-5" />
        </span>
        <h2 className="text-sm font-semibold">마지막 문제까지 도착했어요.</h2>
        <p className="mt-2 text-xs text-muted-foreground">
          답안지에서 빠뜨린 문항을 확인하고 채점해 보세요.
        </p>
        <Button
          className="mt-5"
          disabled={!hydrated || grade.isPending}
          onClick={result ? () => setResetOpen(true) : handleSubmit}
        >
          {result ? "다시 풀기" : "채점하기"}
        </Button>
      </div>
      <Link
        href="/mixer"
        className="mt-6 flex items-center justify-between gap-3 rounded-xl bg-secondary px-5 py-4"
      >
        <span className="flex items-center gap-2 text-xs">
          <Sparkles className="size-4 text-primary" />
          다음은 나만의 기술 스택으로 연습해 볼까요?
        </span>
        <ArrowUpRight className="size-4 shrink-0" />
      </Link>
      <footer className="mt-10 flex items-center justify-between border-t border-border pt-5 text-[10px] text-muted-foreground">
        <span>© 방카이브 / 나의 배움을 쌓는 곳</span>
        <Link href="/mixer" className="flex items-center gap-1">
          <ArrowLeft className="size-3" />
          다른 문제 만들기
        </Link>
      </footer>
      <FloatingIndexBar
        questions={exam.questions}
        answers={answers}
        activeQuestionId={activeQuestionId}
        result={result}
        isPending={grade.isPending}
        disabled={!hydrated}
        onSubmit={handleSubmit}
        onReset={() => setResetOpen(true)}
      />
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 시험을 다시 풀까요?</AlertDialogTitle>
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
                setShowIncompleteNotice(false);
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
