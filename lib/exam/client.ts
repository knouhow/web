import { apiRequest, isRecordValue } from "@/lib/api-client";
import {
  isAnswerForChoiceCount,
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
  type QuestionImage,
  type QuestionReportType,
  type QuestionTable,
  type QuestionSolution,
  type SubjectCatalogItem,
  type Term,
} from "./types";

const MIX_EXAMS_STORAGE_KEY = "knouhow-mix-exams-v1";
const LEGACY_MIX_EXAMS_STORAGE_KEY = "bangchive-mix-exams-v1";
const MIX_EXAM_LIMIT = 10;
const EXPLANATION_POLL_INTERVAL = 2000;
const EXPLANATION_POLL_ATTEMPTS = 30;
export const EXPLANATION_POLL_INTERVAL_MS = EXPLANATION_POLL_INTERVAL;

const TERMS = new Set<Term>([
  "FIRST_SEMESTER",
  "SECOND_SEMESTER",
  "SUMMER_SESSION",
  "WINTER_SESSION",
]);
const EXPLANATION_STATUSES = new Set<ExplanationStatus>([
  "NONE",
  "REQUESTED",
  "GENERATING",
  "COMPLETED",
  "FAILED",
]);

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
  if (typeof value !== "string" || !TERMS.has(value as Term))
    throw new Error("시험 학기 형식이 올바르지 않습니다.");
  return value as Term;
}

function parseExplanationStatus(value: unknown): ExplanationStatus {
  if (
    typeof value !== "string" ||
    !EXPLANATION_STATUSES.has(value as ExplanationStatus)
  )
    throw new Error("해설 상태 형식이 올바르지 않습니다.");
  return value as ExplanationStatus;
}

function parseChoices(value: unknown, expectedCount?: number): Choices {
  if (
    !Array.isArray(value) ||
    (value.length !== 2 && value.length !== 4) ||
    (expectedCount !== undefined && value.length !== expectedCount) ||
    !value.every((choice) => typeof choice === "string")
  )
    throw new Error("선지 응답 형식이 문항 유형과 일치하지 않습니다.");
  return value;
}

function parseQuestionImages(value: unknown): QuestionImage[] {
  if (!Array.isArray(value))
    throw new Error("문항 그림 형식이 올바르지 않습니다.");
  return value.map((image) => {
    if (!isRecordValue(image))
      throw new Error("문항 그림 형식이 올바르지 않습니다.");
    const url = requireString(image.url, "그림 주소");
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error("그림 주소 형식이 올바르지 않습니다.");
    }
    const width = requireNumber(image.width, "그림 너비");
    const height = requireNumber(image.height, "그림 높이");
    const alt = image.alt;
    const seq = requireNumber(image.seq, "그림 순번");
    if (
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      seq <= 0 ||
      width <= 0 ||
      height <= 0 ||
      (alt !== null && alt !== undefined && typeof alt !== "string")
    )
      throw new Error("문항 그림 형식이 올바르지 않습니다.");
    return {
      seq,
      url,
      width,
      height,
      alt: typeof alt === "string" ? alt : null,
    };
  });
}

function parseQuestionTables(value: unknown): QuestionTable[] {
  if (!Array.isArray(value))
    throw new Error("문항 표 형식이 올바르지 않습니다.");
  return value.map((table) => {
    if (!isRecordValue(table) || !Array.isArray(table.rows))
      throw new Error("문항 표 형식이 올바르지 않습니다.");
    const rows = table.rows.map((row) => {
      if (!Array.isArray(row))
        throw new Error("문항 표 행 형식이 올바르지 않습니다.");
      return row.map((cell) => {
        if (!isRecordValue(cell))
          throw new Error("문항 표 셀 형식이 올바르지 않습니다.");
        const rowSpan = requireNumber(cell.rowSpan, "표 셀 행 병합 수");
        const colSpan = requireNumber(cell.colSpan, "표 셀 열 병합 수");
        if (rowSpan <= 0 || colSpan <= 0)
          throw new Error("문항 표 셀 병합 형식이 올바르지 않습니다.");
        return {
          text: requireString(cell.text, "표 셀 내용"),
          rowSpan,
          colSpan,
        };
      });
    });
    const seq = requireNumber(table.seq, "표 순번");
    if (seq <= 0) throw new Error("문항 표 순번 형식이 올바르지 않습니다.");
    return { seq, rows };
  });
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
  const type = value.type === undefined ? "MULTIPLE_CHOICE" : value.type;
  if (type !== "MULTIPLE_CHOICE" && type !== "TRUE_FALSE")
    throw new Error("문제 유형 형식이 올바르지 않습니다.");
  const choices = parseChoices(value.choices, type === "TRUE_FALSE" ? 2 : 4);
  if (type === "TRUE_FALSE" && (choices[0] !== "O" || choices[1] !== "X"))
    throw new Error("O/X 문항 선지는 O, X 순서여야 합니다.");
  return {
    id: requireNumber(value.id, "문제 ID"),
    number,
    category: parsedCategory,
    type,
    text: requireString(value.text, "문제 본문"),
    choices,
    images: value.images === undefined ? [] : parseQuestionImages(value.images),
    tables: value.tables === undefined ? [] : parseQuestionTables(value.tables),
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

function parseGradeQuestion(
  value: unknown,
  choiceCount: number,
): GradeApiQuestion {
  if (!isRecordValue(value))
    throw new Error("문항 채점 응답 형식이 올바르지 않습니다.");
  if (
    (value.selectedAnswer !== null &&
      !isAnswerForChoiceCount(value.selectedAnswer, choiceCount)) ||
    !isAnswerForChoiceCount(value.correctAnswer, choiceCount)
  )
    throw new Error("채점 선지 형식이 올바르지 않습니다.");
  if (typeof value.isCorrect !== "boolean")
    throw new Error("채점 결과 형식이 올바르지 않습니다.");
  if (value.explanation !== null && typeof value.explanation !== "string")
    throw new Error("해설 형식이 올바르지 않습니다.");
  const choiceExplanations =
    value.choiceExplanations == null
      ? null
      : parseChoices(value.choiceExplanations, choiceCount);
  return {
    selectedAnswer: value.selectedAnswer,
    correctAnswer: value.correctAnswer,
    isCorrect: value.isCorrect,
    explanation: value.explanation,
    explanationStatus: parseExplanationStatus(value.explanationStatus),
    choiceExplanations,
  };
}

function parseGrade(value: unknown, exam: Exam): GradeApiResponse {
  if (!isRecordValue(value) || !isRecordValue(value.questions))
    throw new Error("채점 응답 형식이 올바르지 않습니다.");
  const choiceCounts = new Map(
    exam.questions.map((question) => [
      String(question.id),
      question.choices.length,
    ]),
  );
  return {
    correctCount: requireNumber(value.correctCount, "정답 수"),
    answeredCount: requireNumber(value.answeredCount, "응답 수"),
    total: requireNumber(value.total, "문제 수"),
    score: requireNumber(value.score, "점수"),
    maxScore: requireNumber(value.maxScore, "만점"),
    questions: Object.fromEntries(
      Object.entries(value.questions).map(([id, result]) => [
        id,
        parseGradeQuestion(result, choiceCounts.get(id) ?? 0),
      ]),
    ),
  };
}

function toGradeResult(exam: Exam, apiResult: GradeApiResponse): GradeResult {
  const questions: GradeResult["questions"] = {};
  for (const question of exam.questions) {
    const questionId = String(question.id);
    const graded = apiResult.questions[questionId];
    if (!graded) throw new Error(`문항 ${questionId} 채점 결과가 없습니다.`);
    const isAnswered = graded.selectedAnswer !== null;
    questions[questionId] = {
      selectedAnswer: graded.selectedAnswer ?? undefined,
      correctAnswer: graded.correctAnswer,
      isAnswered,
      isCorrect: graded.isCorrect,
      explanation: graded.explanation,
      explanationStatus: graded.explanationStatus,
      choiceExplanations: graded.choiceExplanations,
    };
  }
  return {
    correctCount: apiResult.correctCount,
    answeredCount: apiResult.answeredCount,
    total: apiResult.total,
    score: apiResult.score,
    maxScore: apiResult.maxScore,
    questions,
  };
}

function gradeAnswers(exam: Exam, answers: Answers) {
  const gradeAnswers: Record<string, number | null> = {};
  for (const question of exam.questions) {
    const id = String(question.id);
    if (isAnswerForChoiceCount(answers[id], question.choices.length))
      gradeAnswers[id] = answers[id];
    else if (exam.id === null) gradeAnswers[id] = null;
  }
  return gradeAnswers;
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
    body: JSON.stringify({ answers: gradeAnswers(exam, answers) }),
    signal,
  });
  return parseGrade(value, exam);
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

function hasPendingExplanation(questions: GradeResult["questions"]) {
  return Object.values(questions).some(
    ({ explanationStatus }) =>
      explanationStatus === "REQUESTED" || explanationStatus === "GENERATING",
  );
}

export async function refreshPendingExplanations(
  exam: Exam,
  initialResult: GradeResult,
  signal: AbortSignal,
  attempt = 0,
) {
  if (
    attempt >= EXPLANATION_POLL_ATTEMPTS ||
    !hasPendingExplanation(initialResult.questions)
  )
    return initialResult;

  await waitForExplanation(EXPLANATION_POLL_INTERVAL, signal);
  const pending = Object.entries(initialResult.questions).filter(
    ([, question]) =>
      question.explanationStatus === "REQUESTED" ||
      question.explanationStatus === "GENERATING",
  );
  const solutions = await Promise.all(
    pending.map(([questionId]) => {
      const question = exam.questions.find(
        (item) => String(item.id) === questionId,
      );
      if (!question) return Promise.resolve([questionId, null] as const);
      return fetchQuestionSolution(question, signal).then(
        (solution) => [questionId, solution] as const,
      );
    }),
  );
  const questions = { ...initialResult.questions };
  for (const [questionId, solution] of solutions) {
    const graded = questions[questionId];
    if (!graded || !solution) continue;
    questions[questionId] = {
      ...graded,
      explanation: solution.explanation,
      explanationStatus: solution.explanationStatus,
      choiceExplanations: solution.choiceExplanations,
    };
  }
  return refreshPendingExplanations(
    exam,
    { ...initialResult, questions },
    signal,
    attempt + 1,
  );
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
  return toGradeResult(exam, result);
}

export async function fetchQuestionSolution(
  question: Pick<Question, "id" | "choices">,
  signal: AbortSignal,
): Promise<QuestionSolution> {
  const value = await apiRequest(`/api/questions/${question.id}/solution`, {
    signal,
  });
  if (!isRecordValue(value))
    throw new Error("정답 및 해설 응답 형식이 올바르지 않습니다.");
  if (!isAnswerForChoiceCount(value.correctAnswer, question.choices.length))
    throw new Error("정답 선지 형식이 올바르지 않습니다.");
  if (value.explanation !== null && typeof value.explanation !== "string")
    throw new Error("해설 형식이 올바르지 않습니다.");
  const choiceExplanations =
    value.choiceExplanations == null
      ? null
      : parseChoices(value.choiceExplanations, question.choices.length);
  return {
    correctAnswer: value.correctAnswer,
    explanation: value.explanation,
    explanationStatus: parseExplanationStatus(value.explanationStatus),
    choiceExplanations,
  };
}

export async function retryQuestionExplanation(questionId: number) {
  const value = await apiRequest(`/api/questions/${questionId}/explanation`, {
    method: "POST",
  });
  if (!isRecordValue(value) || value.questionId !== questionId)
    throw new Error("해설 재요청 응답 형식이 올바르지 않습니다.");
  const status = parseExplanationStatus(value.status);
  if (status !== "REQUESTED")
    throw new Error("해설 재요청 응답 상태가 올바르지 않습니다.");
}

export async function submitQuestionReport(
  questionId: number,
  type: QuestionReportType,
  content: string,
) {
  const trimmedContent = content.trim();
  return apiRequest(`/api/questions/${questionId}/reports`, {
    method: "POST",
    body: JSON.stringify({
      type,
      ...(trimmedContent ? { content } : {}),
    }),
  });
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
