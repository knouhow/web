import { expect, test } from "@playwright/test";

test("O/X, 수식, 그림, 표 문항을 계약대로 표시하고 OMR에서 답한다", async ({
  page,
}) => {
  const questions = Array.from({ length: 25 }, (_, index) => {
    const id = 99001 + index;
    if (index === 0) {
      return {
        id,
        number: 1,
        category: null,
        type: "TRUE_FALSE",
        text: "다음 식이 참이면 O, 거짓이면 X: \\(x^2 = 4\\)",
        choices: ["O", "X"],
        images: [],
        tables: [],
      };
    }
    if (index === 1) {
      return {
        id,
        number: 2,
        category: null,
        type: "MULTIPLE_CHOICE",
        text: "그림과 표를 확인하세요.\n[[image:1]]\n[[table:1]]",
        choices: ["선택 A", "\\(\\frac{1}{2}\\)", "선택 C", "선택 D"],
        images: [
          {
            seq: 1,
            url: "https://assets.example.test/format.svg",
            width: 640,
            height: 320,
            alt: "좌표 평면",
          },
        ],
        tables: [
          {
            seq: 1,
            rows: [
              [
                { text: "세로 병합", rowSpan: 2, colSpan: 1 },
                { text: "x 값", rowSpan: 1, colSpan: 2 },
              ],
              [{ text: "y 값", rowSpan: 1, colSpan: 1 }],
            ],
          },
        ],
      };
    }
    return {
      id,
      number: index + 1,
      category: null,
      text: `${index + 1}번 임시 문항`,
      choices: ["선택 1", "선택 2", "선택 3", "선택 4"],
    };
  });

  await page.route("**/api/exams/99007", (route) =>
    route.fulfill({
      json: {
        id: 99007,
        subjectCode: "format-test",
        subjectTitle: "문항 형식 검증",
        examYear: 2026,
        term: "FIRST_SEMESTER",
        termLabel: "1학기",
        questions,
      },
    }),
  );
  await page.route("https://assets.example.test/format.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320"><rect width="640" height="320" fill="#eef1ec" /></svg>',
    }),
  );

  let solutionCalls = 0;
  await page.route("**/api/questions/99001/solution", (route) => {
    solutionCalls += 1;
    return route.fulfill({
      json: {
        correctAnswer: 1,
        explanation: "정답 근거는 \\[x^2 = 4\\] 입니다.",
        explanationStatus: solutionCalls === 1 ? "GENERATING" : "COMPLETED",
        choiceExplanations: ["참입니다.", "거짓입니다."],
      },
    });
  });

  await page.goto("/exam/99007");
  await expect(page.locator("article[data-question-id]")).toHaveCount(25);
  await expect(page.getByRole("radio")).toHaveCount(98);
  await expect(page.getByRole("radio", { name: "1번 문제 O" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "1번 문제 O 선택", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "1번 문제 X 선택", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "2번 문제 선지 4 선택", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".katex").first()).toBeVisible();
  await expect(page.getByRole("table", { name: "문항 표 1" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "세로 병합" })).toHaveAttribute(
    "rowspan",
    "2",
  );
  await expect(page.getByRole("img", { name: "좌표 평면" })).toHaveAttribute(
    "width",
    "640",
  );

  await page
    .getByRole("button", { name: "그림 확대: 좌표 평면", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "좌표 평면 확대 보기" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await page
    .getByRole("button", { name: "1번 문제 X 선택", exact: true })
    .click();
  await expect(page.getByRole("radio", { name: "1번 문제 X" })).toBeChecked();
  await expect(
    page.getByRole("button", { name: "1번 문제 X 선택", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");

  await page
    .locator("#question-99001")
    .getByRole("button", { name: "정답 보기" })
    .click();
  await expect(
    page.getByText("해설을 준비하고 있습니다.", { exact: true }),
  ).toBeVisible();
  await expect.poll(() => solutionCalls, { timeout: 8000 }).toBeGreaterThan(1);
  await expect(page.getByText("정답 근거는", { exact: false })).toBeVisible();
  const pageWidths = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(pageWidths.scroll).toBeLessThanOrEqual(pageWidths.viewport);
});
