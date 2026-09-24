"use client";

import { LoaderCircle, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExamStore } from "@/store/exam-store-provider";
import type { CategoryId } from "@/lib/exam/types";

export function RandomMixButton({
  isPending,
  onGenerate,
}: {
  isPending: boolean;
  onGenerate: (categories: CategoryId[]) => void;
}) {
  const selected = useExamStore((state) => state.selectedCategories);
  const hydrated = useExamStore((state) => state.hydrated);
  return (
    <Button
      size="lg"
      className="h-13 w-full rounded-xl"
      disabled={!hydrated || selected.length === 0 || isPending}
      onClick={() => onGenerate([...selected])}
    >
      {isPending ? (
        <>
          <LoaderCircle className="animate-spin" />
          문제를 섞고 있어요
        </>
      ) : (
        <>
          <Shuffle />
          랜덤 모의고사 만들기
          <span className="ml-1 rounded bg-white/15 px-1.5 py-0.5 text-[10px]">
            25문제
          </span>
        </>
      )}
    </Button>
  );
}
