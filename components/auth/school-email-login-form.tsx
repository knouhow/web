"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/utils";

const EMAIL_DOMAIN = "@knou.ac.kr";

type LoginStep = "email" | "verification";

function isEmailLocalPart(value: string) {
  return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(value.trim());
}

function normalizeLocalPart(value: string) {
  const trimmed = value.trim();
  return trimmed.toLowerCase().endsWith(EMAIL_DOMAIN)
    ? trimmed.slice(0, -EMAIL_DOMAIN.length)
    : trimmed;
}

function isVerificationCode(value: string) {
  return /^\d{6}$/.test(value);
}

export function SchoolEmailLoginForm({
  onSignedIn,
  onSignUp,
}: {
  onSignedIn: () => void;
  onSignUp: () => void;
}) {
  const [step, setStep] = useState<LoginStep>("email");
  const [localPart, setLocalPart] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const { requestEmailVerification, verifyEmailCode } = useAuth();
  const { error: showError, success } = useToast();
  const validEmail = isEmailLocalPart(localPart);
  const showEmailError =
    (localPart.length > 0 && !validEmail) || Boolean(emailError);
  const validVerificationCode = isVerificationCode(verificationCode);
  const showVerificationFormatError =
    verificationCode.length > 0 && !validVerificationCode;
  const email = `${localPart.trim()}${EMAIL_DOMAIN}`.toLowerCase();

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(
      () => setResendSeconds((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  async function requestCode() {
    if (!validEmail || isPending || resendSeconds > 0) return;
    setIsPending(true);
    setEmailError("");
    try {
      const cooldown = await requestEmailVerification(email);
      setVerificationCode("");
      setVerificationError("");
      setResendSeconds(cooldown);
      setStep("verification");
      success({ title: "인증 코드를 보냈습니다." });
    } catch (requestError) {
      if (
        requestError instanceof ApiError &&
        requestError.code === "AUTH_002"
      ) {
        setEmailError("이메일 형식이 올바르지 않습니다.");
      } else if (requestError instanceof ApiError) {
        showError({
          title: "인증 코드를 보내지 못했습니다.",
          description: requestError.message,
        });
      } else {
        showError({ title: "인증 코드를 보내지 못했습니다." });
      }
    } finally {
      setIsPending(false);
    }
  }

  async function verifyCode() {
    if (!validVerificationCode || isPending) return;
    setIsPending(true);
    setVerificationError("");
    try {
      const result = await verifyEmailCode(email, verificationCode);
      if (result === "signed-in") {
        success({ title: "로그인했습니다." });
        onSignedIn();
        return;
      }
      onSignUp();
    } catch (verificationRequestError) {
      if (
        verificationRequestError instanceof ApiError &&
        verificationRequestError.code === "AUTH_006"
      ) {
        setVerificationError("인증 코드가 올바르지 않습니다.");
      } else if (
        verificationRequestError instanceof ApiError &&
        ["AUTH_005", "AUTH_007"].includes(verificationRequestError.code ?? "")
      ) {
        setVerificationError(verificationRequestError.message);
      } else if (verificationRequestError instanceof ApiError) {
        showError({
          title: "이메일을 인증하지 못했습니다.",
          description: verificationRequestError.message,
        });
      } else {
        showError({ title: "이메일을 인증하지 못했습니다." });
      }
    } finally {
      setIsPending(false);
    }
  }

  if (step === "verification") {
    return (
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void verifyCode();
        }}
      >
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{email}</p>
          <label htmlFor="verification-code" className="text-sm font-semibold">
            인증 코드
          </label>
          <Input
            id="verification-code"
            name="verification-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6자리 코드"
            maxLength={6}
            value={verificationCode}
            aria-invalid={
              showVerificationFormatError || Boolean(verificationError)
            }
            aria-describedby={
              showVerificationFormatError || verificationError
                ? "verification-code-error"
                : undefined
            }
            onChange={(event) => {
              setVerificationCode(
                event.target.value.replace(/\D/g, "").slice(0, 6),
              );
              setVerificationError("");
            }}
          />
          {(showVerificationFormatError || verificationError) && (
            <p
              id="verification-code-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {verificationError || "인증 코드는 숫자 6자리로 입력해 주세요."}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            type="submit"
            disabled={!validVerificationCode || isPending}
          >
            {isPending ? "확인 중" : "인증하기"}
            <ArrowRight />
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || resendSeconds > 0}
            onClick={() => void requestCode()}
          >
            {resendSeconds > 0 ? `재전송 ${resendSeconds}초` : "재전송"}
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={isPending}
          onClick={() => {
            setStep("email");
            setVerificationCode("");
            setVerificationError("");
          }}
        >
          다른 이메일 사용
        </Button>
      </form>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void requestCode();
      }}
    >
      <div className="space-y-2">
        <div
          className={cn(
            "flex h-11 overflow-hidden rounded-xl border border-input bg-card transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30",
            showEmailError && "border-destructive",
          )}
        >
          <Input
            id="school-email"
            name="email-local-part"
            type="text"
            autoComplete="username"
            inputMode="email"
            placeholder="이메일"
            value={localPart}
            aria-label="이메일"
            aria-invalid={showEmailError}
            aria-describedby={showEmailError ? "school-email-error" : undefined}
            className="h-full rounded-none border-0 focus-visible:border-transparent focus-visible:ring-0"
            onChange={(event) => {
              setEmailError("");
              setLocalPart(normalizeLocalPart(event.target.value));
            }}
          />
          <span className="flex shrink-0 items-center border-l border-border bg-muted px-3 text-sm font-medium text-foreground">
            {EMAIL_DOMAIN}
          </span>
        </div>
        {showEmailError && (
          <p
            id="school-email-error"
            role="alert"
            className="text-xs text-destructive"
          >
            이메일 형식이 올바르지 않습니다.
          </p>
        )}
      </div>
      <Button
        className="w-full"
        type="submit"
        disabled={!validEmail || isPending}
      >
        {isPending ? "전송 중" : "인증 코드 받기"}
        <ArrowRight />
      </Button>
    </form>
  );
}
