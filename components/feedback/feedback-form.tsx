"use client";

import { useState, type FormEvent } from "react";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";

export function FeedbackForm() {
  const [content, setContent] = useState("");
  const { error, info } = useToast();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) {
      error({ title: "피드백을 입력해 주세요." });
      return;
    }
    info({ title: "피드백 전송 기능을 준비 중입니다." });
  }

  return (
    <form className="mt-8 space-y-3" onSubmit={handleSubmit}>
      <label htmlFor="feedback-content" className="text-sm font-semibold">
        의견
      </label>
      <textarea
        id="feedback-content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="의견을 입력해 주세요."
        className="min-h-40 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <Button type="submit">보내기</Button>
    </form>
  );
}
