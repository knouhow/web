export const QUESTION_COUNT = 25;
export const CATEGORIES = [
  {
    id: "java",
    label: "Java",
    description: "문법과 연산, 객체지향의 기본",
    symbol: "J",
    color: "bg-orange-50 text-orange-700",
  },
  {
    id: "spring",
    label: "Spring",
    description: "DI부터 웹과 데이터 접근까지",
    symbol: "S",
    color: "bg-lime-50 text-lime-700",
  },
  {
    id: "python",
    label: "Python",
    description: "자료형, 컬렉션과 흐름 제어",
    symbol: "Py",
    color: "bg-blue-50 text-blue-700",
  },
  {
    id: "cs",
    label: "컴퓨터과학",
    description: "운영체제 / 네트워크 / 자료구조",
    symbol: "CS",
    color: "bg-violet-50 text-violet-700",
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export type AnswerIndex = 0 | 1 | 2 | 3;
export type Choices = readonly [string, string, string, string];
export type Answers = Record<string, AnswerIndex>;

export interface Question {
  id: string;
  category: CategoryId;
  text: string;
  choices: Choices;
}
export interface Exam {
  id: string;
  title: string;
  kind: "university" | "tech";
  questions: Question[];
}
export interface QuestionResult {
  correctAnswer: AnswerIndex;
  isCorrect: boolean;
  explanation: string;
}
export interface GradeResult {
  correctCount: number;
  total: number;
  score: number;
  questions: Record<string, QuestionResult>;
}

export function isCategory(value: unknown): value is CategoryId {
  return CATEGORIES.some((category) => category.id === value);
}
export function isAnswer(value: unknown): value is AnswerIndex {
  return value === 0 || value === 1 || value === 2 || value === 3;
}
