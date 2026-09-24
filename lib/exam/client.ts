import type { Answers, CategoryId, Exam, GradeResult } from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      typeof body.message === "string" ? body.message : "요청에 실패했습니다.",
    );
  return body as T;
}
export const examQueryKey = (id: string) => ["exam", id] as const;
export const fetchExam = (id: string, signal: AbortSignal) =>
  request<Exam>(`/api/exams/${encodeURIComponent(id)}`, { signal });
export const submitExam = (id: string, answers: Answers) =>
  request<GradeResult>(`/api/exams/${encodeURIComponent(id)}/grade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
export const generateMix = (categories: CategoryId[]) =>
  request<Exam>("/api/exams/mix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categories }),
  });

export function scrollToQuestion(id: string) {
  const element = document.getElementById(`question-${id}`);
  if (!element) return;
  element.focus({ preventScroll: true });
  element.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
    block: "start",
  });
}
