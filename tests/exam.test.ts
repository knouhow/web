import { describe, expect, it } from "vitest";
import {
  createMixId,
  getExam,
  gradeExam,
  parseCategories,
  resolveExam,
} from "@/lib/exam/service";
import { CATEGORIES, type Answers } from "@/lib/exam/types";
import { createExamStore } from "@/store/exam-store";

describe("25문항 4지선다 시험", () => {
  it("조회 시 정답과 해설을 노출하지 않는다", () => {
    const exam = getExam("knou-cs");
    expect(exam.questions).toHaveLength(25);
    for (const question of exam.questions) {
      expect(question.choices).toHaveLength(4);
      expect(new Set(question.choices).size).toBe(4);
      expect(question).not.toHaveProperty("correctAnswer");
      expect(question).not.toHaveProperty("explanation");
    }
  });
  it.each(CATEGORIES)("$label 단독으로 25문제를 생성한다", ({ id }) => {
    const exam = getExam(createMixId([id]));
    expect(exam.questions).toHaveLength(25);
    expect(new Set(exam.questions.map((question) => question.id)).size).toBe(
      25,
    );
    expect(
      exam.questions.every(
        (question) => question.category === id && question.choices.length === 4,
      ),
    ).toBe(true);
  });
  it("선택 카테고리를 균등하게 섞고 seed로 복원한다", () => {
    for (let seed = 0; seed < 20; seed++) {
      const id = `mix_java.python.spring_${seed.toString(16).padStart(8, "0")}`;
      const exam = getExam(id);
      expect(getExam(id)).toEqual(exam);
      expect(new Set(exam.questions.map((q) => q.id)).size).toBe(25);
      expect(new Set(exam.questions.map((q) => q.category))).toEqual(
        new Set(["java", "spring", "python"]),
      );
      for (const category of ["java", "spring", "python"])
        expect([8, 9]).toContain(
          exam.questions.filter((q) => q.category === category).length,
        );
    }
    expect(getExam("mix_java.spring_00000001").questions).not.toEqual(
      getExam("mix_java.spring_00000002").questions,
    );
  });
  it.each([[], ["unknown"], ["java", "java"], null, "java"])(
    "잘못된 카테고리 %j 거부",
    (value) => {
      expect(() => parseCategories(value)).toThrow();
    },
  );
  it("존재하지 않는 시험을 거부한다", () =>
    expect(() => getExam("invalid")).toThrow());
  it("정확한 채점과 입력 검증", () => {
    const questions = resolveExam("knou-cs").questions;
    const answers = Object.fromEntries(
      questions.map((q) => [q.id, q.correctAnswer]),
    );
    expect(gradeExam("knou-cs", answers)).toMatchObject({
      correctCount: 25,
      score: 100,
    });
    expect(gradeExam("knou-cs", { ...answers, "cs-1": 0 })).toMatchObject({
      correctCount: 24,
      score: 96,
    });
    expect(() => gradeExam("knou-cs", {})).toThrow();
    expect(() => gradeExam("knou-cs", { ...answers, "cs-1": 4 })).toThrow();
    expect(() => gradeExam("knou-cs", { ...answers, "cs-1": "1" })).toThrow();
    expect(() => gradeExam("knou-cs", { ...answers, unknown: 0 })).toThrow();
  });
});

describe("Zustand 사용자 입력", () => {
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
    first.getState().markAnswer("knou-cs", "cs-1", 0);
    const restored = createExamStore(storage);
    expect(restored.getState().sessions).toEqual({});
    await restored.persist.rehydrate();
    expect(restored.getState().sessions["knou-cs"].answers["cs-1"]).toBe(0);
    expect(restored.getState().selectedCategories).toContain("python");
  });
  it("①의 값 0을 저장하고 시험마다 분리한다", () => {
    const store = createExamStore();
    store.getState().markAnswer("exam-a", "cs-1", 0);
    store.getState().markAnswer("exam-b", "cs-1", 2);
    expect(store.getState().sessions["exam-a"].answers["cs-1"]).toBe(0);
    expect(store.getState().sessions["exam-b"].answers["cs-1"]).toBe(2);
    store.getState().resetExam("exam-a");
    expect(store.getState().sessions["exam-a"].answers).toEqual({});
    expect(store.getState().sessions["exam-b"].answers["cs-1"]).toBe(2);
  });
  it("채점 후 답안을 잠그고 초기화하면 다시 마킹할 수 있다", () => {
    const store = createExamStore();
    const answers: Answers = Object.fromEntries(
      resolveExam("knou-cs").questions.map((q) => [q.id, q.correctAnswer]),
    );
    for (const [id, answer] of Object.entries(answers))
      store.getState().markAnswer("knou-cs", id, answer);
    store.getState().setResult("knou-cs", gradeExam("knou-cs", answers));
    store.getState().markAnswer("knou-cs", "cs-1", 0);
    expect(store.getState().sessions["knou-cs"].answers["cs-1"]).toBe(1);
    store.getState().resetExam("knou-cs");
    store.getState().markAnswer("knou-cs", "cs-1", 0);
    expect(store.getState().sessions["knou-cs"].answers["cs-1"]).toBe(0);
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
