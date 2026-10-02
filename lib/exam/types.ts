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
export type Term =
  "FIRST_SEMESTER" | "SECOND_SEMESTER" | "SUMMER_SESSION" | "WINTER_SESSION";
export type ExplanationStatus =
  "NONE" | "REQUESTED" | "GENERATING" | "COMPLETED" | "FAILED";

export interface Question {
  id: number;
  number: number | null;
  category: CategoryId | null;
  text: string;
  choices: Choices;
}

export interface Exam {
  routeId: string;
  id: number | null;
  subjectCode: string | null;
  title: string;
  kind: "university" | "tech";
  examYear: number | null;
  termLabel: string | null;
  questions: Question[];
}

export interface QuestionSolution {
  correctAnswer: AnswerIndex;
  explanation: string | null;
  explanationStatus: ExplanationStatus;
  choiceExplanations?: Choices | null;
}

export interface QuestionResult extends QuestionSolution {
  selectedAnswer?: AnswerIndex;
  isAnswered: boolean;
  isCorrect: boolean;
}

export interface GradeResult {
  correctCount: number;
  answeredCount: number;
  total: number;
  score: number;
  questions: Record<string, QuestionResult>;
}

export interface PastExamRecord {
  examId: number;
  examYear: number;
  term: Term;
  termLabel: string;
}

export interface SubjectCatalogItem {
  id: number;
  code: string;
  title: string;
  department: string;
  pastExams: PastExamRecord[];
}

export interface ExamApiResponse {
  id: number;
  subjectCode: string;
  subjectTitle: string;
  examYear: number;
  term: Term;
  termLabel: string;
  questions: Question[];
}

export interface GradeApiQuestion {
  selectedAnswer: AnswerIndex;
  correctAnswer: AnswerIndex;
  isCorrect: boolean;
  explanation: string | null;
  explanationStatus: ExplanationStatus;
}

export interface GradeApiResponse {
  correctCount: number;
  total: number;
  score: number;
  questions: Record<string, GradeApiQuestion>;
}

export interface ExplanationStatusResponse {
  questionId: number;
  status: ExplanationStatus;
}

export function isCategory(value: unknown): value is CategoryId {
  return CATEGORIES.some((category) => category.id === value);
}

export function isAnswer(value: unknown): value is AnswerIndex {
  return value === 0 || value === 1 || value === 2 || value === 3;
}
