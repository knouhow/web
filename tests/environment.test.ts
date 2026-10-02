import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, isAbsolute } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { prepareEnvironment } from "@/scripts/with-env.mjs";

const directory = mkdtempSync(join(tmpdir(), "knouhow-env-test-"));
mkdirSync(join(directory, "web-config", "config"), { recursive: true });
for (const stage of ["local", "development", "production"]) {
  writeFileSync(
    join(directory, "web-config", "config", `${stage}.env`),
    `APP_ENV=${stage}\nNEXT_PUBLIC_APP_ENV=${stage}\nAPI_BASE_URL=https://${stage}.example.test\n`,
  );
}

afterAll(() => {
  const target = relative(tmpdir(), directory);
  if (
    !isAbsolute(target) &&
    !target.startsWith("..") &&
    target.startsWith("knouhow-env-test-")
  )
    rmSync(directory, { recursive: true, force: true });
});

describe("환경 분리", () => {
  it.each(["local", "development", "production"])(
    "%s 환경만 로드하고 NODE_ENV는 변경하지 않는다",
    (stage) => {
      const prepared = prepareEnvironment({
        requested: stage,
        inherited: {},
        projectRoot: directory,
      });
      expect(prepared.env.APP_ENV).toBe(stage);
      expect(prepared.env.NEXT_PUBLIC_APP_ENV).toBe(stage);
      expect(prepared.env.API_BASE_URL).toBe(`https://${stage}.example.test`);
      expect(prepared.env.NODE_ENV).toBeUndefined();
    },
  );
  it.each([
    ["development", "local"],
    ["preview", "development"],
    ["production", "production"],
  ])("Vercel %s를 %s로 매핑하고 파일 없이 동작한다", (vercel, expected) => {
    const prepared = prepareEnvironment({
      inherited: {
        VERCEL: "1",
        VERCEL_ENV: vercel,
        API_BASE_URL: "https://dashboard.example.test",
      },
      projectRoot: "missing-directory",
    });
    expect(prepared.stage).toBe(expected);
    expect(prepared.env.API_BASE_URL).toBe("https://dashboard.example.test");
  });
  it("터미널에 설정한 값을 파일보다 우선한다", () => {
    const prepared = prepareEnvironment({
      inherited: { API_BASE_URL: "https://override.example.test" },
      projectRoot: directory,
    });
    expect(prepared.env.API_BASE_URL).toBe("https://override.example.test");
  });
  it("환경 혼용과 잘못된 운영 브랜치, 누락 파일을 거부한다", () => {
    expect(() =>
      prepareEnvironment({ requested: "staging", inherited: {} }),
    ).toThrow();
    expect(() =>
      prepareEnvironment({
        inherited: { APP_ENV: "production" },
        projectRoot: directory,
      }),
    ).toThrow();
    expect(() =>
      prepareEnvironment({
        requested: "production",
        inherited: { VERCEL_ENV: "preview" },
      }),
    ).toThrow();
    expect(() =>
      prepareEnvironment({
        inherited: {
          VERCEL_ENV: "production",
          VERCEL_GIT_COMMIT_REF: "develop",
        },
      }),
    ).toThrow();
    expect(() =>
      prepareEnvironment({ inherited: {}, projectRoot: "missing-directory" }),
    ).toThrow(/Missing/);
  });
  it("Next.js의 루트 환경파일 자동 로드로 다른 환경이 섞이지 않게 한다", () => {
    const file = join(directory, ".env.local");
    writeFileSync(file, "UNEXPECTED_LOCAL_VALUE=fixture\n");
    try {
      expect(() =>
        prepareEnvironment({
          requested: "production",
          inherited: {},
          projectRoot: directory,
        }),
      ).toThrow(/Root .env/);
    } finally {
      rmSync(file);
    }
  });
});
