import "server-only";
import { randomBytes } from "node:crypto";
import { questionBank, type BankQuestion } from "./question-bank";
import {
  CATEGORIES,
  QUESTION_COUNT,
  isAnswer,
  isCategory,
  type CategoryId,
  type Exam,
  type GradeResult,
} from "./types";

export class ExamError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function parseCategories(value: unknown): CategoryId[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > CATEGORIES.length ||
    !value.every(isCategory)
  ) {
    throw new ExamError("기술 카테고리를 1개 이상 선택해 주세요.");
  }
  if (new Set(value).size !== value.length)
    throw new ExamError("카테고리가 중복되었습니다.");
  return [...value].sort();
}

// 재현 가능한 연습 시험용 PRNG. 인증/보안 토큰에 사용하지 않는다.
function seededRandom(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createMixId(value: unknown): string {
  const categories = parseCategories(value);
  return `mix_${categories.join(".")}_${randomBytes(4).toString("hex")}`;
}

export function resolveExam(id: string): {
  title: string;
  kind: Exam["kind"];
  questions: BankQuestion[];
} {
  if (id === "knou-cs")
    return {
      title: "컴퓨터과학개론",
      kind: "university",
      questions: questionBank.cs,
    };
  const match = /^mix_([a-z.]{1,30})_([0-9a-f]{8})$/.exec(id);
  if (!match) throw new ExamError("시험을 찾을 수 없습니다.", 404);
  const categories = parseCategories(match[1].split("."));
  const random = seededRandom(Number.parseInt(match[2], 16));
  const pools = shuffle(categories, random).map((category) =>
    shuffle(questionBank[category], random),
  );
  const questions: BankQuestion[] = [];
  for (let i = 0; i < QUESTION_COUNT; i++) {
    const question = pools[i % pools.length][Math.floor(i / pools.length)];
    if (!question)
      throw new ExamError("선택한 카테고리의 문제가 부족합니다.", 422);
    questions.push(question);
  }
  return {
    title: "나만의 기술 모의고사",
    kind: "tech",
    questions: shuffle(questions, random),
  };
}

export function getExam(id: string): Exam {
  const exam = resolveExam(id);
  return {
    id,
    title: exam.title,
    kind: exam.kind,
    questions: exam.questions.map(({ id, text, category, choices }) => ({
      id,
      text,
      category,
      choices,
    })),
  };
}

export function gradeExam(id: string, value: unknown): GradeResult {
  const exam = resolveExam(id);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ExamError("답안 형식이 올바르지 않습니다.");
  const answers = Object.fromEntries(Object.entries(value));
  const validIds = new Set(exam.questions.map((question) => question.id));
  if (
    Object.keys(answers).length !== QUESTION_COUNT ||
    Object.keys(answers).some((key) => !validIds.has(key))
  ) {
    throw new ExamError("25문제에 모두 답한 뒤 채점해 주세요.");
  }
  const questions: GradeResult["questions"] = {};
  let correctCount = 0;
  for (const question of exam.questions) {
    if (!isAnswer(answers[question.id]))
      throw new ExamError("선지는 ①~④ 중 하나여야 합니다.");
    const isCorrect = answers[question.id] === question.correctAnswer;
    if (isCorrect) correctCount++;
    questions[question.id] = {
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  }
  return {
    correctCount,
    total: QUESTION_COUNT,
    score: correctCount * 4,
    questions,
  };
}

export function errorResponse(error: unknown) {
  if (error instanceof ExamError)
    return Response.json({ message: error.message }, { status: error.status });
  if (error instanceof SyntaxError)
    return Response.json(
      { message: "JSON 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  console.error(error);
  return Response.json(
    { message: "요청 처리에 실패했습니다. 잠시 후 다시 시도해 주세요." },
    { status: 500 },
  );
}

export async function readBody(
  request: Request,
): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > 16_384)
    throw new ExamError("요청 크기가 너무 큽니다.", 413);
  const body: unknown = JSON.parse(text);
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new ExamError("요청 형식이 올바르지 않습니다.");
  return Object.fromEntries(Object.entries(body));
}
