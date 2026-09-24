import { createStore } from "zustand/vanilla";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import {
  isAnswer,
  isCategory,
  type AnswerIndex,
  type Answers,
  type CategoryId,
  type GradeResult,
} from "@/lib/exam/types";

export interface ExamSession {
  answers: Answers;
  result?: GradeResult;
}
export interface ExamStore {
  selectedCategories: CategoryId[];
  sessions: Record<string, ExamSession>;
  hydrated: boolean;
  storageError: boolean;
  finishHydration: (failed?: boolean) => void;
  toggleCategory: (category: CategoryId) => void;
  markAnswer: (examId: string, questionId: string, answer: AnswerIndex) => void;
  setResult: (examId: string, result: GradeResult) => void;
  resetExam: (examId: string) => void;
}

// 최근 10개 시험만 저장해 로컬 저장소가 무한히 커지는 것을 방지한다.
function updateSession(
  sessions: ExamStore["sessions"],
  id: string,
  session: ExamSession,
) {
  const remaining = Object.entries(sessions)
    .filter(([key]) => key !== id)
    .slice(-9);
  return { ...Object.fromEntries(remaining), [id]: session };
}

export function createExamStore(storage?: StateStorage) {
  let reportStorageError = () => {};
  const browserStorage: StateStorage = {
    getItem: (name) => {
      if (typeof window === "undefined") return null;
      try {
        return window.localStorage.getItem(name);
      } catch {
        queueMicrotask(() => reportStorageError());
        return null;
      }
    },
    setItem: (name, value) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(name, value);
      } catch {
        queueMicrotask(() => reportStorageError());
      }
    },
    removeItem: (name) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.removeItem(name);
      } catch {
        queueMicrotask(() => reportStorageError());
      }
    },
  };
  const store = createStore<ExamStore>()(
    persist(
      (set) => ({
        selectedCategories: ["java", "spring"],
        sessions: {},
        hydrated: false,
        storageError: false,
        finishHydration: (failed = false) =>
          set((state) => ({
            hydrated: true,
            storageError: state.storageError || failed,
          })),
        toggleCategory: (category) =>
          set((state) => ({
            selectedCategories: state.selectedCategories.includes(category)
              ? state.selectedCategories.filter((id) => id !== category)
              : [...state.selectedCategories, category],
          })),
        markAnswer: (examId, questionId, answer) =>
          set((state) => {
            const session = state.sessions[examId];
            if (session?.result || !isAnswer(answer)) return state;
            return {
              sessions: updateSession(state.sessions, examId, {
                answers: { ...session?.answers, [questionId]: answer },
              }),
            };
          }),
        setResult: (examId, result) =>
          set((state) => ({
            sessions: updateSession(state.sessions, examId, {
              answers: state.sessions[examId]?.answers ?? {},
              result,
            }),
          })),
        resetExam: (examId) =>
          set((state) => ({
            sessions: updateSession(state.sessions, examId, { answers: {} }),
          })),
      }),
      {
        name: "bangchive-practice-v1",
        version: 1,
        storage: createJSONStorage(() => storage ?? browserStorage),
        skipHydration: true,
        partialize: ({ selectedCategories, sessions }) => ({
          selectedCategories,
          sessions: Object.fromEntries(
            Object.entries(sessions).map(([id, session]) => [
              id,
              { answers: session.answers },
            ]),
          ),
        }),
        merge: (persisted, current) => {
          // 손상된 저장 데이터도 UI를 중단시키지 않는다. 해설은 다음 채점 때 다시 받는다.
          if (!persisted || typeof persisted !== "object") return current;
          const saved = Object.fromEntries(Object.entries(persisted));
          const selectedCategories = Array.isArray(saved.selectedCategories)
            ? [...new Set(saved.selectedCategories.filter(isCategory))]
            : current.selectedCategories;
          const sessions: ExamStore["sessions"] = {};
          if (saved.sessions && typeof saved.sessions === "object") {
            for (const [id, value] of Object.entries(saved.sessions).slice(
              -10,
            )) {
              if (
                !value ||
                typeof value !== "object" ||
                !("answers" in value) ||
                !value.answers ||
                typeof value.answers !== "object"
              )
                continue;
              const answers: Answers = {};
              for (const [questionId, answer] of Object.entries(
                value.answers,
              )) {
                if (isAnswer(answer)) answers[questionId] = answer;
              }
              sessions[id] = { answers };
            }
          }
          return { ...current, selectedCategories, sessions };
        },
      },
    ),
  );
  reportStorageError = () => {
    if (!store.getState().storageError) store.setState({ storageError: true });
  };
  return store;
}
