"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { CATEGORIES } from "@/lib/exam/types";
import { useExamStore } from "@/store/exam-store-provider";
import { cn } from "@/lib/utils";

export function CategorySelector({ disabled = false }: { disabled?: boolean }) {
  const selected = useExamStore((state) => state.selectedCategories);
  const toggle = useExamStore((state) => state.toggleCategory);
  const hydrated = useExamStore((state) => state.hydrated);
  return (
    <fieldset disabled={disabled || !hydrated}>
      <legend className="mb-5 text-base font-semibold">
        어떤 기술을 연습할까요?{" "}
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          여러 개 선택할 수 있어요
        </span>
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {CATEGORIES.map((category) => (
          <label
            key={category.id}
            htmlFor={`category-${category.id}`}
            className={cn(
              "flex cursor-pointer items-start gap-4 rounded-2xl border bg-card p-5 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-primary",
              selected.includes(category.id)
                ? "border-primary bg-primary/3"
                : "border-border hover:border-primary/40",
              disabled && "cursor-wait opacity-70",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-xl font-mono text-lg font-semibold",
                category.color,
              )}
            >
              {category.symbol}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold">{category.label}</span>
              <span className="mt-1.5 block text-xs leading-5 text-muted-foreground">
                {category.description}
              </span>
              <span className="mt-3 block text-[10px] text-muted-foreground">
                샘플 문제 25개
              </span>
            </span>
            <Checkbox
              id={`category-${category.id}`}
              checked={selected.includes(category.id)}
              disabled={disabled || !hydrated}
              onCheckedChange={() => toggle(category.id)}
              aria-label={category.label}
              className="mt-1"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
