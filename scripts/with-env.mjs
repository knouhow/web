import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseEnv } from "node:util";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stages = ["local", "development", "production"];
const vercelStages = {
  development: "local",
  preview: "development",
  production: "production",
};

/**
 * @param {{ requested?: string, inherited?: Record<string, string | undefined>, projectRoot?: string }} options
 * @returns {{ stage: string, env: Record<string, string | undefined>, source: string }}
 */
export function prepareEnvironment({
  requested = "auto",
  inherited = process.env,
  projectRoot = root,
} = {}) {
  const onVercel = inherited.VERCEL === "1" || Boolean(inherited.VERCEL_ENV);
  const target = onVercel ? vercelStages[inherited.VERCEL_ENV] : undefined;
  if (onVercel && !target)
    throw new Error("VERCEL_ENV must be development, preview or production.");
  const stage = requested === "auto" ? (target ?? "local") : requested;
  if (!stages.includes(stage))
    throw new Error(
      "Environment must be auto, local, development or production.",
    );
  if (onVercel && stage !== target)
    throw new Error(
      "Requested environment conflicts with the Vercel deployment target.",
    );
  if (
    target === "production" &&
    inherited.VERCEL_GIT_COMMIT_REF &&
    inherited.VERCEL_GIT_COMMIT_REF !== "main"
  ) {
    throw new Error(
      "Production deployment must use the main branch. Check the Vercel Production Branch setting.",
    );
  }

  let values = {};
  const relativePath = `web-config/config/${stage}.env`;
  if (!onVercel) {
    const implicitFiles = [
      ".env",
      ".env.local",
      ".env.development",
      ".env.development.local",
      ".env.production",
      ".env.production.local",
      ".env.test",
      ".env.test.local",
    ];
    if (implicitFiles.some((name) => existsSync(join(projectRoot, name)))) {
      throw new Error(
        "Root .env files can mix environments through Next.js auto-loading. Keep application environment files in web-config/config instead.",
      );
    }
    try {
      values = parseEnv(readFileSync(join(projectRoot, relativePath), "utf8"));
    } catch (error) {
      if (error.code === "ENOENT")
        throw new Error(
          `Missing ${relativePath}. Initialize web-config with the checkout override documented in AGENTS.md.`,
        );
      throw new Error(
        `Cannot read ${relativePath}. Check the environment file without printing its secrets.`,
      );
    }
    if (
      "NODE_ENV" in values ||
      Object.keys(values).some((key) => key.startsWith("VERCEL"))
    ) {
      throw new Error(
        "Do not set NODE_ENV or VERCEL variables in application environment files.",
      );
    }
  }

  // Existing shell / Vercel variables take precedence; environment identity must agree.
  const env = { ...values, ...inherited };
  for (const key of ["APP_ENV", "NEXT_PUBLIC_APP_ENV"]) {
    if (env[key] !== undefined && env[key] !== stage)
      throw new Error(`${key} does not match the selected environment.`);
    env[key] = stage;
  }
  return {
    stage,
    env,
    source: onVercel ? "Vercel environment variables" : relativePath,
  };
}

function main() {
  const [requested = "auto", command, ...args] = process.argv.slice(2);
  if (!["dev", "build", "start"].includes(command))
    throw new Error(
      "Usage: node scripts/with-env.mjs <environment> <dev|build|start> [Next.js options]",
    );
  const { stage, env, source } = prepareEnvironment({ requested });
  env.NODE_ENV = command === "dev" ? "development" : "production";
  console.info(`[environment] ${stage} / ${source}`);
  const require = createRequire(import.meta.url);
  const child = spawn(
    process.execPath,
    [require.resolve("next/dist/bin/next"), command, ...args],
    {
      cwd: root,
      env,
      stdio: "inherit",
      shell: false,
    },
  );
  child.on("error", () => {
    console.error("Could not start Next.js.");
    process.exitCode = 1;
  });
  child.on("exit", (code, signal) => {
    process.exitCode = code ?? (signal ? 1 : 0);
  });
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => child.kill(signal));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
