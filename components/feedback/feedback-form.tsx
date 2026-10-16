"use client";

import { useState, type SubmitEvent } from "react";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api-client";

export function FeedbackForm() {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error, success } = useToast();

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      error({ title: "피드백을 입력해 주세요." });
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiRequest("/api/feedbacks", {
        method: "POST",
        body: JSON.stringify({ content: trimmedContent }),
      });
      setContent("");
      success({ title: "피드백을 전송했습니다." });
    } catch (submitError) {
      error({
        title: "피드백을 전송하지 못했습니다.",
        description:
          submitError instanceof Error
            ? submitError.message
            : "잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-0" onSubmit={handleSubmit}>
      <textarea
        id="feedback-content"
        aria-label="의견"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="의견을 입력해 주세요."
        maxLength={2000}
        className="min-h-40 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "제출 중" : "제출하기"}
        </Button>
      </div>
    </form>
  );
}
