import { expect, test } from "@playwright/test";

test("25문항, 마킹/복원/OMR 이동/채점/다시 풀기", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "과목 목록" })).toBeVisible();
  await expect(
    page.getByRole("searchbox", { name: "과목 검색" }),
  ).toBeVisible();
  await page.locator("summary", { hasText: "컴퓨터과학개론" }).click();
  await page.getByRole("link", { name: "2025년 기출문제" }).click();
  await expect(page).toHaveURL("/exam/knou-cs");
  const main = page.getByRole("main");
  await expect(main.getByText("기출문제", { exact: true })).toBeVisible();
  await expect(main.getByText("컴퓨터과학개론", { exact: true })).toBeVisible();
  await expect(
    main.getByText("2025년 기출문제", { exact: true }),
  ).toBeVisible();
  await expect(
    main.getByRole("link", { name: "컴퓨터과학개론", exact: true }),
  ).toHaveCount(0);
  const questions = page.locator("article[data-question-id]");
  await expect(questions).toHaveCount(25);
  await expect(page.getByRole("radio")).toHaveCount(100);
  await page.screenshot({ path: testInfo.outputPath("exam.png") });
  const firstChoice = page.locator("#question-cs-1 label").first();
  await firstChoice.click();
  await expect(
    page.getByRole("button", { name: "1번 푼 문제", exact: true }),
  ).toBeVisible();
  await firstChoice.click();
  await expect(page.locator("#question-cs-1 input:checked")).toHaveCount(0);
  await firstChoice.click();
  await page.reload();
  await expect(page.locator('#question-cs-1 input[value="0"]')).toBeChecked();
  await page
    .locator("#question-cs-1")
    .getByRole("button", { name: "정답 보기" })
    .click();
  await expect(page.locator("#question-cs-1").getByText("해설")).toBeVisible();
  await expect(page.locator("#question-cs-1 input").first()).toBeDisabled();
  await page
    .locator("#question-cs-1")
    .getByRole("button", { name: "다시 풀기" })
    .click();
  await expect(page.locator("#question-cs-1 input").first()).toBeEnabled();
  await firstChoice.click();
  const target = page.getByRole("button", {
    name: "25번 안 푼 문제",
    exact: true,
  });
  await target.click();
  await expect(page.locator("#question-cs-25")).toBeFocused();
  const bounds = await page.locator("#question-cs-25").boundingBox();
  expect(bounds?.y).toBeGreaterThanOrEqual(72);
  expect(bounds?.y).toBeLessThan(300);
  await page.getByRole("button", { name: "채점하기" }).click();
  await expect(
    page.getByText("채점이 완료되었습니다.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "1문제 중 0문제 정답" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "다시 풀기", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "다시 풀기" })
    .click();
  await expect(page.locator('input[type="radio"]:checked')).toHaveCount(0);
  for (let index = 0; index < 25; index++)
    await questions.nth(index).locator("label").first().click();
  await page.getByRole("button", { name: "채점하기" }).click();
  await expect(
    page.getByRole("heading", { name: "25문제 중 6문제 정답" }),
  ).toBeVisible();
  await expect(page.getByText("해설", { exact: true })).toHaveCount(25);
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
  await page.getByRole("button", { name: /랜덤 문제집 만들기/ }).click();
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
  await page.locator("summary", { hasText: "컴퓨터과학개론" }).click();
  await page.getByRole("link", { name: "2025년 기출문제" }).click();
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
    page.getByRole("button", { name: /랜덤 문제집 만들기/ }),
  ).toBeDisabled();
});

test("과목 검색과 헤더 메뉴", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("노하우");
  await expect(
    page.getByText("기출문제 저작권은 한국방송통신대학교에 있습니다.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "한국방송통신대학교" }),
  ).toHaveAttribute("href", "https://www.knou.ac.kr/");
  const titles = await page.locator("summary").allTextContents();
  expect(titles).toEqual(
    [...titles].sort((left, right) => {
      const leftStartsWithEnglish = /^[A-Za-z]/.test(left.trim());
      const rightStartsWithEnglish = /^[A-Za-z]/.test(right.trim());
      if (leftStartsWithEnglish !== rightStartsWithEnglish)
        return leftStartsWithEnglish ? -1 : 1;
      return left.localeCompare(right, "ko-KR");
    }),
  );
  await page.getByRole("button", { name: "맨 끝 페이지" }).click();
  await expect(page.getByRole("button", { name: "2페이지" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.getByRole("button", { name: "1페이지" }).click();
  const search = page.getByRole("searchbox", { name: "과목 검색" });
  await search.fill("없는 과목");
  await expect(page.getByText("검색 결과 없음")).toBeVisible();
  await search.fill("컴퓨터");
  await expect(
    page.locator("summary", { hasText: "컴퓨터과학개론" }),
  ).toBeVisible();
  await page.locator("summary", { hasText: "컴퓨터과학개론" }).click();
  await expect(
    page.getByRole("link", { name: "2025년 기출문제" }),
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "기출문제", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "학습", exact: true }).click();
  await expect(
    page.getByText("서비스 준비 중입니다.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "학습", exact: true }).click();
  const studyToasts = page
    .locator('[data-state="open"]')
    .filter({ hasText: "서비스 준비 중입니다." });
  await expect(studyToasts).toHaveCount(2);
  const toastTops = await studyToasts.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().top),
  );
  expect(toastTops[1]).toBeGreaterThan(toastTops[0]);
  await expect(
    page.getByRole("button", { name: "로그인", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "student 메뉴" })).toHaveCount(
    0,
  );
});

test("기말고사에서 과목 목록의 선택한 위치로 돌아간다", async ({ page }) => {
  await page.goto("/");
  await page.locator("summary", { hasText: "컴퓨터과학개론" }).click();
  await expect(page).toHaveURL("/#subject-knou-cs");
  const historyLength = await page.evaluate(() => window.history.length);
  expect(historyLength).toBeGreaterThan(1);
  await page.getByRole("link", { name: "2025년 기출문제" }).click();
  await expect(page).toHaveURL("/exam/knou-cs");
  const examHistoryLength = await page.evaluate(() => window.history.length);
  expect(examHistoryLength).toBeGreaterThan(historyLength);
  await page.goBack();
  await expect(page).toHaveURL("/#subject-knou-cs");
  await expect(page.locator("#subject-knou-cs")).toHaveAttribute("open", "");

  await page.goto("/exam/knou-cs");
  await page.getByRole("link", { name: "뒤로가기" }).click();
  await expect(page).toHaveURL("/#subject-knou-cs");
  const subject = page.locator("#subject-knou-cs");
  await expect(subject).toHaveAttribute("open", "");
  await expect(
    subject.getByRole("link", { name: "2025년 기출문제" }),
  ).toBeVisible();
  const bounds = await subject.boundingBox();
  expect(bounds?.y).toBeGreaterThanOrEqual(64);
});

test("API는 빈 답안을 채점하고 잘못된 카테고리를 거부한다", async ({
  request,
}) => {
  const exam = await request.get("/api/exams/knou-cs");
  expect(exam.ok()).toBe(true);
  const body = await exam.json();
  expect(body.questions).toHaveLength(25);
  expect(body.questions[0]).not.toHaveProperty("correctAnswer");
  const grade = await request.post("/api/exams/knou-cs/grade", {
    data: { answers: {} },
  });
  expect(grade.status()).toBe(200);
  await expect(grade.json()).resolves.toMatchObject({
    answeredCount: 0,
    correctCount: 0,
  });
  const solution = await request.get(
    "/api/exams/knou-cs/questions/cs-1/solution",
  );
  expect(solution.ok()).toBe(true);
  await expect(solution.json()).resolves.toMatchObject({ correctAnswer: 1 });
  const mix = await request.post("/api/exams/mix", {
    data: { categories: ["invalid"] },
  });
  expect(mix.status()).toBe(400);
});

test("학교 이메일 로그인과 서비스 정책", async ({ page }) => {
  await page.goto("/");
  const brand = page.locator('header a[href="/"]').first();
  const beforeDialog = await page.evaluate(() => {
    const headerBrand = document.querySelector('header a[href="/"]');
    if (!headerBrand) throw new Error("브랜드를 찾지 못했습니다.");
    return {
      x: headerBrand.getBoundingClientRect().x,
      bodyMarginRight: window.getComputedStyle(document.body).marginRight,
    };
  });
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.body.dataset.scrollLocked))
    .toBe("1");
  const afterDialog = await page.evaluate(() => {
    const headerBrand = document.querySelector('header a[href="/"]');
    if (!headerBrand) throw new Error("브랜드를 찾지 못했습니다.");
    return {
      x: headerBrand.getBoundingClientRect().x,
      bodyMarginRight: window.getComputedStyle(document.body).marginRight,
    };
  });
  expect(afterDialog.x).toBeCloseTo(beforeDialog.x, 0.1);
  expect(afterDialog.bodyMarginRight).toBe(beforeDialog.bodyMarginRight);
  const email = dialog.getByRole("textbox", { name: "이메일" });
  await expect(email).toHaveAttribute("placeholder", "이메일");
  await expect(dialog.locator("label")).toHaveCount(0);
  await expect(dialog.getByText("@knou.ac.kr", { exact: true })).toBeVisible();
  await expect(dialog.getByText("@knou.ac.kr", { exact: true })).toHaveClass(
    /text-foreground/,
  );
  const sendCodeButton = dialog.getByRole("button", {
    name: "인증 코드 받기",
    exact: true,
  });
  await email.fill("student@example.com");
  await expect(
    page.getByText("이메일 형식이 올바르지 않습니다.", { exact: true }),
  ).toBeVisible();
  await expect(sendCodeButton).toBeDisabled();
  await email.fill("student");
  await expect(sendCodeButton).toBeEnabled();
  await sendCodeButton.click();
  const verificationCode = dialog.getByRole("textbox", { name: "인증 코드" });
  await expect(verificationCode).toBeVisible();
  await expect(
    dialog.getByText("로컬 인증 코드: 123456", { exact: true }),
  ).toBeVisible();
  await verificationCode.fill("000000");
  await dialog.getByRole("button", { name: "인증하기", exact: true }).click();
  await expect(
    dialog.getByText("인증 코드가 올바르지 않습니다.", { exact: true }),
  ).toBeVisible();
  await verificationCode.fill("123456");
  await dialog.getByRole("button", { name: "인증하기", exact: true }).click();
  await expect(page).toHaveURL("/signup");
  await expect(page.getByRole("heading", { name: "회원가입" })).toBeVisible();
  await expect(
    page.getByRole("banner").getByRole("button", {
      name: "로그인",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "이메일" })).toHaveValue(
    "student@knou.ac.kr",
  );
  const signUpButton = page.getByRole("button", {
    name: "가입하기",
    exact: true,
  });
  await expect(signUpButton).toBeDisabled();
  await page.getByRole("textbox", { name: "이름" }).fill("학생 이름");
  await page
    .getByRole("checkbox", { name: "서비스 이용약관에 동의합니다." })
    .click();
  await page
    .getByRole("checkbox", { name: "개인정보처리방침에 동의합니다." })
    .click();
  await expect(signUpButton).toBeEnabled();
  await signUpButton.click();
  await expect(
    page.getByText("회원가입이 완료되었습니다.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL("/mypage");
  const accountMenu = page.getByRole("button", { name: / 메뉴$/ });
  await expect(accountMenu).toBeVisible();

  const beforeAccountMenu = await brand.boundingBox();
  await accountMenu.click();
  const afterAccountMenu = await brand.boundingBox();
  if (!beforeAccountMenu || !afterAccountMenu) {
    throw new Error("브랜드 위치를 확인하지 못했습니다.");
  }
  expect(afterAccountMenu.x).toBeCloseTo(beforeAccountMenu.x, 2);

  await page.getByRole("menuitem", { name: "마이페이지" }).click();
  await expect(page).toHaveURL("/mypage");
  await expect(page.getByRole("heading", { name: "마이페이지" })).toBeVisible();
  await expect(
    page.getByText("student@knou.ac.kr", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "수정" }).click();
  await page.getByRole("textbox", { name: "닉네임" }).fill("student2");
  await page.getByRole("button", { name: "저장" }).click();
  await expect(
    page.getByText("닉네임을 수정했습니다.", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: / 메뉴$/ }).click();
  await page.getByRole("menuitem", { name: "설정" }).click();
  await expect(page).toHaveURL("/settings");
  await expect(page.getByRole("heading", { name: "설정" })).toBeVisible();
  await page.getByRole("textbox", { name: "이름" }).fill("학생 이름");
  await page.getByRole("button", { name: "저장" }).click();
  await expect(
    page.getByText("이름을 수정했습니다.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: / 메뉴$/ }).click();
  await page.getByRole("menuitem", { name: "로그아웃" }).click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("banner").getByRole("button", {
      name: "로그인",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/mypage");
  await expect(page).toHaveURL("/");
  await page.goto("/settings");
  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  const secondDialog = page.getByRole("dialog");
  await secondDialog.getByRole("textbox", { name: "이메일" }).fill("student");
  await secondDialog
    .getByRole("button", { name: "인증 코드 받기", exact: true })
    .click();
  await secondDialog.getByRole("textbox", { name: "인증 코드" }).fill("123456");
  await secondDialog
    .getByRole("button", { name: "인증하기", exact: true })
    .click();
  await expect(
    page.getByText("로그인했습니다.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: / 메뉴$/ }).click();
  await page.getByRole("menuitem", { name: "설정" }).click();
  await page.getByRole("button", { name: "회원 탈퇴", exact: true }).click();
  const withdrawalDialog = page.getByRole("alertdialog");
  await expect(withdrawalDialog).toBeVisible();
  await expect(
    withdrawalDialog.getByText("탈퇴하면 계정을 복구할 수 없습니다.", {
      exact: true,
    }),
  ).toBeVisible();
  await withdrawalDialog.getByRole("button", { name: "취소" }).click();
  await expect(withdrawalDialog).toBeHidden();
  await page.getByRole("button", { name: "회원 탈퇴", exact: true }).click();
  await withdrawalDialog.getByRole("button", { name: "회원 탈퇴" }).click();
  await expect(
    page.getByText("회원 탈퇴가 완료되었습니다.", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL("/");
  const footer = page.locator("footer");
  const footerNavigation = footer.getByRole("navigation", {
    name: "서비스 정보",
  });
  await expect(footerNavigation.locator("a, button")).toHaveText([
    "개인정보처리방침",
    "서비스 이용약관",
    "서비스 피드백",
  ]);
  const footerNavigationBox = await footerNavigation.boundingBox();
  const copyrightBox = await footer
    .getByText("© 2026 노하우 / KNOUHow")
    .boundingBox();
  expect(copyrightBox?.y).toBeGreaterThan(footerNavigationBox?.y ?? 0);
  await page.getByRole("button", { name: "서비스 피드백" }).click();
  const feedbackDialog = page.getByRole("dialog");
  await expect(feedbackDialog).toBeVisible();
  await feedbackDialog.getByRole("textbox", { name: "의견" }).fill("메뉴 의견");
  await feedbackDialog.getByRole("button", { name: "보내기" }).click();
  await expect(
    page.getByText("피드백 전송 기능을 준비 중입니다.", { exact: true }),
  ).toBeVisible();
  await feedbackDialog.getByRole("button", { name: "닫기" }).click();
  await expect(feedbackDialog).toBeHidden();
  await page.getByRole("link", { name: "서비스 이용약관" }).click();
  await expect(page).toHaveURL("/terms");
  await expect(
    page.getByRole("heading", { name: "서비스 이용약관" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "개인정보처리방침" }).click();
  await expect(page).toHaveURL("/privacy");
  await expect(
    page.getByRole("heading", { name: "개인정보처리방침" }),
  ).toBeVisible();
});

test("채점 오류를 전역 토스트로 알린다", async ({ page }) => {
  await page.goto("/");
  await page.locator("summary", { hasText: "컴퓨터과학개론" }).click();
  await page.getByRole("link", { name: "2025년 기출문제" }).click();
  await page.route("**/api/exams/knou-cs/grade", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "서버 오류입니다." }),
    }),
  );
  await page.getByRole("button", { name: "채점하기" }).click();
  await expect(
    page.getByText("채점하지 못했습니다.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("서버 오류입니다.", { exact: true }),
  ).toBeVisible();
});
