import { expect, test } from "@playwright/test";

test("25문항, 마킹/복원/OMR 이동/채점/다시 풀기", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const questions = page.locator("article[data-question-id]");
  await expect(questions).toHaveCount(25);
  await expect(page.getByRole("radio")).toHaveCount(100);
  await expect(
    page.getByText("브라우저 자동 저장", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("exam.png") });
  await page.getByRole("button", { name: "답안 제출하고 채점하기" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "25문제가 비어",
  );
  await page.locator("#question-cs-1 label").first().click();
  await expect(
    page.getByRole("button", { name: "1번 응답 완료", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator('#question-cs-1 input[value="0"]')).toBeChecked();
  const target = page.getByRole("button", { name: "25번 미응답", exact: true });
  await target.click();
  await expect(page.locator("#question-cs-25")).toBeFocused();
  const bounds = await page.locator("#question-cs-25").boundingBox();
  expect(bounds?.y).toBeGreaterThanOrEqual(72);
  expect(bounds?.y).toBeLessThan(150);
  for (let index = 0; index < 25; index++)
    await questions.nth(index).locator("label").first().click();
  await page.getByRole("button", { name: "답안 제출하고 채점하기" }).click();
  await expect(
    page.getByRole("heading", { name: "25문제 중 6문제 정답" }),
  ).toBeVisible();
  await expect(page.locator("details[open]")).toHaveCount(25);
  await expect(page.getByRole("radio").first()).toBeDisabled();
  await page
    .getByRole("button", { name: "다시 풀기", exact: true })
    .last()
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "다시 풀기" })
    .click();
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  await expect(page.locator("details")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("카테고리 선택 후 기술 시험 생성, 모바일 가로 넘침 없음", async ({
  page,
}, testInfo) => {
  await page.goto("/mixer");
  await expect(
    page.getByRole("checkbox", { name: "Java", exact: true }),
  ).toBeChecked();
  await page.screenshot({
    path: testInfo.outputPath("mixer.png"),
    fullPage: true,
  });
  await page.getByRole("checkbox", { name: "Spring", exact: true }).click();
  await page.getByRole("checkbox", { name: "Python", exact: true }).click();
  await page.getByRole("button", { name: /랜덤 모의고사 만들기/ }).click();
  await expect(page).toHaveURL(/\/exam\/mix_java.python_[0-9a-f]{8}/);
  await expect(page.locator("article[data-question-id]")).toHaveCount(25);
  const ids = await page
    .locator("article[data-question-id]")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-question-id")),
    );
  expect(
    ids.every((id) => id?.startsWith("java-") || id?.startsWith("python-")),
  ).toBe(true);
  expect(new Set(ids).size).toBe(25);
  await page.reload();
  await expect(page.locator("article[data-question-id]")).toHaveCount(25);
  const overflowing = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflowing).toBe(false);
});

test("키보드 선택, 저장소 차단 시 풀이, 카테고리 미선택 방지", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });
  });
  await page.goto("/");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "브라우저 저장소를 사용할 수 없어",
  );
  const first = page.locator('#question-cs-1 input[value="0"]');
  await first.focus();
  await page.keyboard.press("Space");
  await expect(first).toBeChecked();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('#question-cs-1 input[value="1"]')).toBeChecked();
  await page.goto("/mixer");
  await page.getByRole("checkbox", { name: "Java", exact: true }).click();
  await page.getByRole("checkbox", { name: "Spring", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /랜덤 모의고사 만들기/ }),
  ).toBeDisabled();
});

test("API는 미완성 답안과 잘못된 카테고리를 거부한다", async ({ request }) => {
  const exam = await request.get("/api/exams/knou-cs");
  expect(exam.ok()).toBe(true);
  const body = await exam.json();
  expect(body.questions).toHaveLength(25);
  expect(body.questions[0]).not.toHaveProperty("correctAnswer");
  const grade = await request.post("/api/exams/knou-cs/grade", {
    data: { answers: {} },
  });
  expect(grade.status()).toBe(400);
  const mix = await request.post("/api/exams/mix", {
    data: { categories: ["invalid"] },
  });
  expect(mix.status()).toBe(400);
});
