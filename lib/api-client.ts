export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function apiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!value)
    throw new Error("NEXT_PUBLIC_API_BASE_URL이 설정되지 않았습니다.");
  return value.replace(/\/+$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function apiRequest(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError(
      "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      0,
    );
  }

  if (response.status === 204) {
    if (!response.ok)
      throw new ApiError("요청에 실패했습니다.", response.status);
    return null;
  }

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      if (response.ok)
        throw new ApiError(
          "서버 응답 형식이 올바르지 않습니다.",
          response.status,
        );
    }
  }

  if (!response.ok) {
    const message =
      isRecord(body) && typeof body.message === "string"
        ? body.message
        : "요청에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    const code =
      isRecord(body) && typeof body.code === "string" ? body.code : undefined;
    throw new ApiError(message, response.status, code);
  }
  return body;
}

export function isRecordValue(
  value: unknown,
): value is Record<string, unknown> {
  return isRecord(value);
}
