"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, Shuffle } from "lucide-react";
import { CategorySelector } from "./category-selector";
import { RandomMixButton } from "./random-mix-button";
import { useToast } from "@/components/toast-provider";
import { examQueryKey, generateMix } from "@/lib/exam/client";
import { CATEGORIES } from "@/lib/exam/types";
import { useExamStore } from "@/store/exam-store-provider";

export function TechStackMixer() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { error, success } = useToast();
  const selected = useExamStore((state) => state.selectedCategories);
  const mix = useMutation({
    mutationFn: generateMix,
    onSuccess: (exam) => {
      queryClient.setQueryData(examQueryKey(exam.routeId), exam);
      success({ title: "문제집을 만들었습니다." });
      router.push(`/exam/${exam.routeId}`);
    },
    onError: (mutationError) => {
      error({
        title: "문제집을 만들지 못했습니다.",
        description: mutationError.message,
      });
    },
  });
  return (
    <main
      id="main-content"
      className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-16"
    >
      <span className="inline-flex items-center gap-2 rounded-full bg-primary/7 px-3 py-1.5 text-xs font-semibold text-primary">
        <Shuffle className="size-3.5" />
        CUSTOM WORKBOOK
      </span>
      <h1 className="mt-5 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
        나만의 문제집 만들기
      </h1>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        카테고리를 선택하세요.
      </p>
      <div className="mt-10 grid gap-7 lg:grid-cols-[1fr_280px]">
        <section>
          <CategorySelector disabled={mix.isPending} />
          <div className="mt-6 flex gap-3 rounded-xl bg-secondary p-4 text-xs leading-6 text-muted-foreground">
            <Check className="mt-1 size-4 shrink-0 text-primary" />
            <p>
              선택한 기술이 모두 포함되도록 균등하게 섞어요.
              <br />한 시험 안에서 같은 문제는 반복되지 않아요.
            </p>
          </div>
        </section>
        <aside
          aria-label="문제집 구성"
          className="self-start rounded-2xl border border-border bg-card p-6"
        >
          <h2 className="text-base font-bold">이번 문제집 구성</h2>
          <div className="my-5 border-t border-border" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">선택한 기술</span>
            <strong>{selected.length}개</strong>
          </div>
          <div
            aria-live="polite"
            className="my-4 flex min-h-8 flex-wrap gap-1.5"
          >
            {selected.length ? (
              CATEGORIES.filter((category) =>
                selected.includes(category.id),
              ).map((category) => (
                <span
                  key={category.id}
                  className="rounded-md bg-primary/7 px-2 py-1 text-xs font-medium text-primary"
                >
                  {category.label}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">
                기술을 1개 이상 선택해 주세요.
              </span>
            )}
          </div>
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-muted-foreground">총 문항 수</span>
            <strong>25문제</strong>
          </div>
          <div className="mb-6 flex justify-between text-xs">
            <span className="text-muted-foreground">문제 형식</span>
            <strong>4지선다</strong>
          </div>
          <RandomMixButton
            isPending={mix.isPending || mix.isSuccess}
            onGenerate={(categories) => mix.mutate(categories)}
          />
          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            선택한 기술 카테고리에서 문제를 가져옵니다.
          </p>
        </aside>
      </div>
      <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
        <span>기술 선택</span>
        <ArrowRight className="size-3" />
        <span>25문제 풀기</span>
        <ArrowRight className="size-3" />
        <span>채점과 해설 확인</span>
      </div>
    </main>
  );
}
