"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export function SignUpPage() {
  const router = useRouter();
  const { hydrated, pendingSignUpEmail, register, user } = useAuth();
  const { error: showError, success } = useToast();
  const [name, setName] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (user) {
      router.replace("/mypage");
      return;
    }
    if (!pendingSignUpEmail) router.replace("/");
  }, [hydrated, pendingSignUpEmail, router, user]);

  if (!hydrated || !pendingSignUpEmail || user) {
    return <main id="main-content" className="min-h-72" aria-busy="true" />;
  }

  const valid = Boolean(name.trim()) && termsAgreed && privacyAgreed;

  return (
    <main
      id="main-content"
      className="mx-auto min-h-72 max-w-md px-4 py-12 sm:px-8"
    >
      <h1 className="text-2xl font-bold">회원가입</h1>
      <form
        className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid) return;
          setIsSubmitting(true);
          void register(name, termsAgreed, privacyAgreed)
            .then(() => {
              success({ title: "회원가입이 완료되었습니다." });
              router.replace("/mypage");
            })
            .catch((submitError: unknown) => {
              showError({
                title: "회원가입을 완료하지 못했습니다.",
                description:
                  submitError instanceof ApiError
                    ? submitError.message
                    : undefined,
              });
            })
            .finally(() => setIsSubmitting(false));
        }}
      >
        <div className="space-y-2">
          <label htmlFor="sign-up-email" className="text-sm font-semibold">
            이메일
          </label>
          <Input id="sign-up-email" value={pendingSignUpEmail} disabled />
        </div>
        <div className="space-y-2">
          <label htmlFor="sign-up-name" className="text-sm font-semibold">
            이름
          </label>
          <Input
            id="sign-up-name"
            autoComplete="name"
            value={name}
            maxLength={30}
            required
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">약관 동의</legend>
          <div className="flex items-center gap-2">
            <Checkbox
              id="terms"
              checked={termsAgreed}
              onCheckedChange={(checked) => setTermsAgreed(checked === true)}
            />
            <label htmlFor="terms" className="text-sm">
              <Link href="/terms" className="underline underline-offset-4">
                서비스 이용약관
              </Link>
              에 동의합니다.
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="privacy"
              checked={privacyAgreed}
              onCheckedChange={(checked) => setPrivacyAgreed(checked === true)}
            />
            <label htmlFor="privacy" className="text-sm">
              <Link href="/privacy" className="underline underline-offset-4">
                개인정보처리방침
              </Link>
              에 동의합니다.
            </label>
          </div>
        </fieldset>
        <Button
          className="w-full"
          type="submit"
          disabled={!valid || isSubmitting}
        >
          {isSubmitting ? "가입 중" : "가입하기"}
        </Button>
      </form>
    </main>
  );
}
