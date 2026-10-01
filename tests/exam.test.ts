import { describe, expect, it } from "vitest";
import type { GradeResult } from "@/lib/exam/types";
import { createExamStore } from "@/store/exam-store";

const EMPTY_GRADE_RESULT: GradeResult = {
  correctCount: 0,
  answeredCount: 0,
  total: 25,
  score: 0,
  questions: {},
};

describe("Zustand 사용자 입력", () => {
  it("브랜드 변경 전 저장된 답안을 새 저장 키로 옮긴다", async () => {
    const values = new Map<string, string>([
      [
        "bangchive-practice-v1",
        JSON.stringify({
          state: {
            selectedCategories: ["python"],
            sessions: { "exam-100": { answers: { "1001": 0 } } },
          },
          version: 1,
        }),
      ],
    ]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    };
    const store = createExamStore(storage);

    await store.persist.rehydrate();

    expect(store.getState().sessions["exam-100"].answers["1001"]).toBe(0);
    expect(store.getState().selectedCategories).toEqual(["python"]);
    expect(values.has("knouhow-practice-v1")).toBe(true);
    expect(values.has("bangchive-practice-v1")).toBe(false);
  });

  it("답안과 카테고리는 복원하되 결과는 서버에서 다시 채점한다", async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    };
    const first = createExamStore(storage);
    first.getState().toggleCategory("python");
    first.getState().markAnswer("exam-100", "1001", 0);
    const restored = createExamStore(storage);
    expect(restored.getState().sessions).toEqual({});
    await restored.persist.rehydrate();
    expect(restored.getState().sessions["exam-100"].answers["1001"]).toBe(0);
    expect(restored.getState().selectedCategories).toContain("python");
  });
  it("①의 값 0을 저장하고 시험마다 분리한다", () => {
    const store = createExamStore();
    store.getState().markAnswer("exam-101", "1001", 0);
    store.getState().markAnswer("exam-102", "1001", 2);
    expect(store.getState().sessions["exam-101"].answers["1001"]).toBe(0);
    expect(store.getState().sessions["exam-102"].answers["1001"]).toBe(2);
    store.getState().resetExam("exam-101");
    expect(store.getState().sessions["exam-101"].answers).toEqual({});
    expect(store.getState().sessions["exam-102"].answers["1001"]).toBe(2);
  });
  it("채점 후 답안을 잠그고 초기화하면 다시 마킹할 수 있다", () => {
    const store = createExamStore();
    store.getState().markAnswer("exam-100", "1001", 1);
    store.getState().setResult("exam-100", EMPTY_GRADE_RESULT);
    store.getState().markAnswer("exam-100", "1001", 0);
    expect(store.getState().sessions["exam-100"].answers["1001"]).toBe(1);
    expect(store.getState().sessions["exam-100"].result).toBeDefined();
    store.getState().clearAnswer("exam-100", "1001");
    expect(store.getState().sessions["exam-100"].answers["1001"]).toBe(1);
    store.getState().resetExam("exam-100");
    store.getState().markAnswer("exam-100", "1001", 0);
    store.getState().clearAnswer("exam-100", "1001");
    expect(
      store.getState().sessions["exam-100"].answers["1001"],
    ).toBeUndefined();
  });
  it("Provider별 인스턴스가 독립적이고 카테고리를 토글한다", () => {
    const first = createExamStore();
    const second = createExamStore();
    first.getState().toggleCategory("python");
    expect(first.getState().selectedCategories).toContain("python");
    expect(second.getState().selectedCategories).not.toContain("python");
    first.getState().toggleCategory("java");
    expect(first.getState().selectedCategories).not.toContain("java");
  });
});
