import { apiRequest, isRecordValue } from "@/lib/api-client";
import {
  isAnswer,
  isCategory,
  type Answers,
  type CategoryId,
  type Choices,
  type ExplanationStatus,
  type Exam,
  type GradeApiQuestion,
  type GradeApiResponse,
  type GradeResult,
  type PastExamRecord,
  type Question,
  type QuestionSolution,
  type SubjectCatalogItem,
  type Term,
} from "./types";

const MIX_EXAMS_STORAGE_KEY = "knouhow-mix-exams-v1";
const LEGACY_MIX_EXAMS_STORAGE_KEY = "bangchive-mix-exams-v1";
const MIX_EXAM_LIMIT = 10;
const EXPLANATION_POLL_INTERVAL = 2000;
const EXPLANATION_POLL_ATTEMPTS = 30;

const TERMS: readonly Term[] = [
  "FIRST_SEMESTER",
  "SECOND_SEMESTER",
  "SUMMER_SESSION",
  "WINTER_SESSION",
];
const EXPLANATION_STATUSES: readonly ExplanationStatus[] = [
  "NONE",
  "REQUESTED",
  "GENERATING",
  "COMPLETED",
  "FAILED",
];

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string")
    throw new Error(`${label} 형식이 올바르지 않습니다.`);
  return value;
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value))
    throw new Error(`${label} 형식이 올바르지 않습니다.`);
  return value;
}

function parseTerm(value: unknown): Term {
  if (typeof value !== "string" || !TERMS.includes(value as Term))
    throw new Error("시험 학기 형식이 올바르지 않습니다.");
  return value as Term;
}

function parseExplanationStatus(value: unknown): ExplanationStatus {
  if (
    typeof value !== "string" ||
    !EXPLANATION_STATUSES.includes(value as ExplanationStatus)
  )
    throw new Error("해설 상태 형식이 올바르지 않습니다.");
  return value as ExplanationStatus;
}

function parseChoices(value: unknown): Choices {
  if (
    !Array.isArray(value) ||
    value.length !== 4 ||
    !value.every((choice) => typeof choice === "string")
  )
    throw new Error("선지 응답은 네 항목이어야 합니다.");
  return [value[0], value[1], value[2], value[3]];
}

function parseQuestion(value: unknown): Question {
  if (!isRecordValue(value))
    throw new Error("문제 응답 형식이 올바르지 않습니다.");
  const category = value.category;
  let parsedCategory: CategoryId | null;
  if (category === null) parsedCategory = null;
  else if (isCategory(category)) parsedCategory = category;
  else throw new Error("문제 카테고리 형식이 올바르지 않습니다.");
  const number = value.number;
  if (
    number !== null &&
    (typeof number !== "number" || !Number.isSafeInteger(number))
  )
    throw new Error("문제 번호 형식이 올바르지 않습니다.");
  return {
    id: requireNumber(value.id, "문제 ID"),
    number,
    category: parsedCategory,
    text: requireString(value.text, "문제 본문"),
    choices: parseChoices(value.choices),
  };
}

function parseExamQuestions(value: unknown): Question[] {
  if (!Array.isArray(value))
    throw new Error("문제 목록 형식이 올바르지 않습니다.");
  const questions = value.map(parseQuestion);
  if (questions.length !== 25) throw new Error("시험은 25문제여야 합니다.");
  return questions;
}

function parsePastExam(value: unknown): PastExamRecord {
  if (!isRecordValue(value))
    throw new Error("기출 목록 형식이 올바르지 않습니다.");
  return {
    examId: requireNumber(value.examId, "시험 ID"),
    examYear: requireNumber(value.examYear, "시험 연도"),
    term: parseTerm(value.term),
    termLabel: requireString(value.termLabel, "시험 학기 이름"),
  };
}

function parseSubject(value: unknown): SubjectCatalogItem {
  if (!isRecordValue(value))
    throw new Error("과목 응답 형식이 올바르지 않습니다.");
  if (!Array.isArray(value.pastExams))
    throw new Error("기출 목록 형식이 올바르지 않습니다.");
  return {
    id: requireNumber(value.id, "과목 ID"),
    code: requireString(value.code, "과목 코드"),
    title: requireString(value.title, "과목명"),
    department: requireString(value.department, "학과명"),
    pastExams: value.pastExams.map(parsePastExam),
  };
}

function parseExam(value: unknown): Exam {
  if (!isRecordValue(value))
    throw new Error("시험 응답 형식이 올바르지 않습니다.");
  const questions = parseExamQuestions(value.questions);
  const subjectCode = requireString(value.subjectCode, "과목 코드");
  const isUniversity =
    Boolean(subjectCode) &&
    questions.length > 0 &&
    questions.every((question) => question.category === null);
  const id = requireNumber(value.id, "시험 ID");
  return {
    routeId: String(id),
    id,
    subjectCode,
    title: requireString(value.subjectTitle, "과목명"),
    kind: isUniversity ? "university" : "tech",
    examYear: requireNumber(value.examYear, "시험 연도"),
    termLabel: requireString(value.termLabel, "시험 학기 이름"),
    questions,
  };
}

function parseMixExam(value: unknown, routeId: string): Exam {
  if (!isRecordValue(value))
    throw new Error("랜덤 문제 응답 형식이 올바르지 않습니다.");
  const questions = parseExamQuestions(value.questions);
  if (questions.length !== 25)
    throw new Error("랜덤 시험은 25문제여야 합니다.");
  return {
    routeId,
    id: null,
    subjectCode: null,
    title: "나만의 문제집",
    kind: "tech",
    examYear: null,
    termLabel: null,
    questions,
  };
}

function readStoredMixExams(): Exam[] {
  try {
    let raw = window.localStorage.getItem(MIX_EXAMS_STORAGE_KEY);
    if (raw === null) {
      raw = window.localStorage.getItem(LEGACY_MIX_EXAMS_STORAGE_KEY);
      if (raw !== null) {
        try {
          window.localStorage.setItem(MIX_EXAMS_STORAGE_KEY, raw);
          window.localStorage.removeItem(LEGACY_MIX_EXAMS_STORAGE_KEY);
        } catch {
          // 새 키에 복사할 수 없어도 기존 저장값을 계속 읽는다.
        }
      }
    }
    if (!raw) return [];
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      if (!isRecordValue(item) || typeof item.routeId !== "string") return [];
      try {
        return [parseMixExam(item, item.routeId)];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

function saveMixExam(exam: Exam) {
  try {
    const exams = readStoredMixExams().filter(
      (item) => item.routeId !== exam.routeId,
    );
    window.localStorage.setItem(
      MIX_EXAMS_STORAGE_KEY,
      JSON.stringify([...exams, exam].slice(-MIX_EXAM_LIMIT)),
    );
  } catch {
    // 저장소를 사용할 수 없어도 현재 페이지에서는 생성한 시험을 풀이할 수 있다.
  }
}

function parseGradeQuestion(value: unknown): GradeApiQuestion {
  if (!isRecordValue(value))
    throw new Error("문항 채점 응답 형식이 올바르지 않습니다.");
  if (!isAnswer(value.selectedAnswer) || !isAnswer(value.correctAnswer))
    throw new Error("채점 선지 형식이 올바르지 않습니다.");
  if (typeof value.isCorrect !== "boolean")
    throw new Error("채점 결과 형식이 올바르지 않습니다.");
  if (value.explanation !== null && typeof value.explanation !== "string")
    throw new Error("해설 형식이 올바르지 않습니다.");
  return {
    selectedAnswer: value.selectedAnswer,
    correctAnswer: value.correctAnswer,
    isCorrect: value.isCorrect,
    explanation: value.explanation,
    explanationStatus: parseExplanationStatus(value.explanationStatus),
  };
}

function parseGrade(value: unknown): GradeApiResponse {
  if (!isRecordValue(value) || !isRecordValue(value.questions))
    throw new Error("채점 응답 형식이 올바르지 않습니다.");
  return {
    correctCount: requireNumber(value.correctCount, "정답 수"),
    total: requireNumber(value.total, "문제 수"),
    score: requireNumber(value.score, "점수"),
    questions: Object.fromEntries(
      Object.entries(value.questions).map(([id, result]) => [
        id,
        parseGradeQuestion(result),
      ]),
    ),
  };
}

function toGradeResult(
  exam: Exam,
  answers: Answers,
  apiResult: GradeApiResponse,
): GradeResult {
  let answeredCount = 0;
  let correctCount = 0;
  const questions: GradeResult["questions"] = {};
  for (const question of exam.questions) {
    const questionId = String(question.id);
    const isAnswered = answers[questionId] !== undefined;
    const graded = apiResult.questions[questionId];
    if (!graded) throw new Error(`문항 ${questionId} 채점 결과가 없습니다.`);
    if (isAnswered) {
      answeredCount += 1;
      if (answers[questionId] === graded.correctAnswer) correctCount += 1;
    }
    questions[questionId] = {
      selectedAnswer: isAnswered ? answers[questionId] : undefined,
      correctAnswer: graded.correctAnswer,
      isAnswered,
      isCorrect: isAnswered && answers[questionId] === graded.correctAnswer,
      explanation: graded.explanation,
      explanationStatus: graded.explanationStatus,
    };
  }
  return {
    correctCount,
    answeredCount,
    total: apiResult.total,
    score: correctCount * 4,
    questions,
  };
}

function completeAnswers(exam: Exam, answers: Answers): Answers {
  return Object.fromEntries(
    exam.questions.map((question) => {
      const id = String(question.id);
      return [id, answers[id] ?? 0];
    }),
  );
}

async function gradeFromApi(
  exam: Exam,
  answers: Answers,
  signal?: AbortSignal,
) {
  const path =
    exam.id === null ? "/api/mixes/grade" : `/api/exams/${exam.id}/grade`;
  const value = await apiRequest(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers: completeAnswers(exam, answers) }),
    signal,
  });
  return parseGrade(value);
}

function waitForExplanation(delay: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, delay);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function loadExplanationStatus(
  questionId: number,
  initialStatus: ExplanationStatus,
  signal: AbortSignal,
) {
  let status = initialStatus;
  if (status === "NONE" || status === "FAILED") {
    await apiRequest(`/api/questions/${questionId}/explanation`, {
      method: "POST",
      signal,
    });
    status = "REQUESTED";
  }

  for (let attempt = 0; attempt < EXPLANATION_POLL_ATTEMPTS; attempt += 1) {
    if (status === "COMPLETED" || status === "FAILED") return status;
    await waitForExplanation(EXPLANATION_POLL_INTERVAL, signal);
    const value = await apiRequest(
      `/api/questions/${questionId}/explanation/status`,
      { signal },
    );
    if (!isRecordValue(value))
      throw new Error("해설 상태 응답이 올바르지 않습니다.");
    status = parseExplanationStatus(value.status);
  }
  return status;
}

function hasPendingExplanation(questions: GradeResult["questions"]) {
  return Object.values(questions).some(
    ({ explanationStatus }) =>
      explanationStatus === "REQUESTED" || explanationStatus === "GENERATING",
  );
}

export async function refreshPendingExplanations(
  exam: Exam,
  answers: Answers,
  initialResult: GradeResult,
  signal: AbortSignal,
) {
  let result = initialResult;
  const hadPendingAtStart = hasPendingExplanation(result.questions);
  let completedAny = Object.values(result.questions).some(
    ({ explanationStatus }) => explanationStatus === "COMPLETED",
  );

  for (
    let attempt = 0;
    attempt < EXPLANATION_POLL_ATTEMPTS &&
    hasPendingExplanation(result.questions);
    attempt += 1
  ) {
    await waitForExplanation(EXPLANATION_POLL_INTERVAL, signal);
    const pending = Object.entries(result.questions).filter(
      ([, question]) =>
        question.explanationStatus === "REQUESTED" ||
        question.explanationStatus === "GENERATING",
    );
    const statuses = await Promise.all(
      pending.map(async ([questionId]) => {
        const id = Number(questionId);
        const value = await apiRequest(
          `/api/questions/${id}/explanation/status`,
          { signal },
        );
        if (!isRecordValue(value) || value.questionId !== id)
          throw new Error("해설 상태 응답이 올바르지 않습니다.");
        return [questionId, parseExplanationStatus(value.status)] as const;
      }),
    );
    const questions = { ...result.questions };
    for (const [questionId, explanationStatus] of statuses) {
      const question = questions[questionId];
      if (!question) continue;
      questions[questionId] = { ...question, explanationStatus };
      if (explanationStatus === "COMPLETED") completedAny = true;
    }
    result = { ...result, questions };
  }

  if (!hadPendingAtStart || !completedAny) return result;
  const refreshedGrade = await gradeFromApi(exam, answers, signal);
  return toGradeResult(exam, answers, refreshedGrade);
}

export const examQueryKey = (id: string) => ["exam", id] as const;
export const subjectsQueryKey = ["subjects"] as const;
export const questionSolutionQueryKey = (examId: string, questionId: number) =>
  ["question-solution", examId, questionId] as const;

export async function fetchSubjects(signal: AbortSignal) {
  const value = await apiRequest("/api/subjects", { signal });
  if (!Array.isArray(value))
    throw new Error("과목 목록 응답이 올바르지 않습니다.");
  return value.map(parseSubject);
}

export async function fetchExam(routeId: string, signal: AbortSignal) {
  if (routeId.startsWith("mix-")) {
    const exam = readStoredMixExams().find((item) => item.routeId === routeId);
    if (!exam) throw new Error("저장된 랜덤 시험을 찾을 수 없습니다.");
    return exam;
  }
  if (!/^\d+$/.test(routeId)) throw new Error("시험을 찾을 수 없습니다.");
  const value = await apiRequest(`/api/exams/${routeId}`, { signal });
  return parseExam(value);
}

export async function submitExam(exam: Exam, answers: Answers) {
  const result = await gradeFromApi(exam, answers);
  return toGradeResult(exam, answers, result);
}

export async function fetchQuestionSolution(
  exam: Exam,
  questionId: number,
  answers: Answers,
  signal: AbortSignal,
): Promise<QuestionSolution> {
  // 임시 연동: 계약에 문항별 정답 API가 생기면 전체 채점 우회 호출을 교체한다.
  let grade = await gradeFromApi(exam, answers, signal);
  let question = grade.questions[String(questionId)];
  if (!question) throw new Error(`문항 ${questionId} 채점 결과가 없습니다.`);

  if (question.explanationStatus !== "COMPLETED") {
    const status = await loadExplanationStatus(
      questionId,
      question.explanationStatus,
      signal,
    );
    if (status === "COMPLETED") {
      grade = await gradeFromApi(exam, answers, signal);
      question = grade.questions[String(questionId)];
      if (!question)
        throw new Error(`문항 ${questionId} 채점 결과가 없습니다.`);
    } else {
      question = { ...question, explanationStatus: status };
    }
  }
  return {
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    explanationStatus: question.explanationStatus,
  };
}

export async function generateMix(categories: CategoryId[]) {
  const value = await apiRequest("/api/mixes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categories }),
  });
  const routeId = `mix-${crypto.randomUUID()}`;
  const exam = parseMixExam(value, routeId);
  saveMixExam(exam);
  return exam;
}

export function scrollToQuestion(id: number) {
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
