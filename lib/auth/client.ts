import { ApiError, apiRequest, isRecordValue } from "@/lib/api-client";

export interface AuthUser {
  email: string;
  nickname: string;
  name: string;
}

export interface EmailVerificationRequest {
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
}

export type EmailVerificationResult =
  { kind: "signed-in"; user: AuthUser } | { kind: "sign-up-required" };

function parseUser(value: unknown): AuthUser {
  if (
    !isRecordValue(value) ||
    typeof value.email !== "string" ||
    typeof value.nickname !== "string" ||
    typeof value.name !== "string"
  )
    throw new Error("회원 정보 응답 형식이 올바르지 않습니다.");
  return {
    email: value.email,
    nickname: value.nickname,
    name: value.name,
  };
}

export async function requestEmailVerification(email: string) {
  const value = await apiRequest("/api/auth/email-verifications", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (
    !isRecordValue(value) ||
    typeof value.expiresInSeconds !== "number" ||
    !Number.isSafeInteger(value.expiresInSeconds) ||
    typeof value.resendAvailableInSeconds !== "number" ||
    !Number.isSafeInteger(value.resendAvailableInSeconds)
  )
    throw new Error("인증 요청 응답 형식이 올바르지 않습니다.");
  return {
    expiresInSeconds: value.expiresInSeconds,
    resendAvailableInSeconds: value.resendAvailableInSeconds,
  } satisfies EmailVerificationRequest;
}

export async function verifyEmailCode(email: string, code: string) {
  const value = await apiRequest("/api/auth/email-verifications/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
  if (!isRecordValue(value) || typeof value.isNewUser !== "boolean")
    throw new Error("인증 응답 형식이 올바르지 않습니다.");
  if (value.isNewUser) return { kind: "sign-up-required" } as const;
  return { kind: "signed-in", user: parseUser(value.user) } as const;
}

export async function getCurrentUser() {
  const value = await apiRequest("/api/auth/me");
  if (!isRecordValue(value))
    throw new Error("회원 정보 응답 형식이 올바르지 않습니다.");
  return parseUser(value.user);
}

export async function signUp(
  name: string,
  termsAgreed: boolean,
  privacyAgreed: boolean,
) {
  const value = await apiRequest("/api/auth/sign-up", {
    method: "POST",
    body: JSON.stringify({ name, termsAgreed, privacyAgreed }),
  });
  if (!isRecordValue(value))
    throw new Error("가입 응답 형식이 올바르지 않습니다.");
  return parseUser(value.user);
}

export async function signOutRequest() {
  await apiRequest("/api/auth/sign-out", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function updateProfile(field: "nickname" | "name", value: string) {
  const response = await apiRequest("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify({ [field]: value }),
  });
  if (!isRecordValue(response))
    throw new Error("회원 정보 응답 형식이 올바르지 않습니다.");
  return parseUser(response.user);
}

export async function withdrawAccount() {
  await apiRequest("/api/users/me", { method: "DELETE" });
}

export function isUnauthenticatedError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}
