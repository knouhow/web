"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  requestEmailVerification as requestEmailVerificationApi,
  signOutRequest,
  signUp as signUpApi,
  updateProfile,
  verifyEmailCode as verifyEmailCodeApi,
  withdrawAccount,
  type AuthUser,
} from "@/lib/auth/client";

const PENDING_SIGN_UP_EMAIL_KEY = "knouhow-pending-sign-up-v1";
const LEGACY_PENDING_SIGN_UP_EMAIL_KEY = "bangchive-pending-sign-up-v1";
const PENDING_SIGN_UP_EMAIL_EVENT = "knouhow-pending-sign-up-change";

interface AuthContextValue {
  user: AuthUser | null;
  hydrated: boolean;
  pendingSignUpEmail: string | null;
  requestEmailVerification: (email: string) => Promise<number>;
  verifyEmailCode: (
    email: string,
    code: string,
  ) => Promise<"signed-in" | "sign-up-required">;
  signOut: () => Promise<void>;
  register: (
    name: string,
    termsAgreed: boolean,
    privacyAgreed: boolean,
  ) => Promise<AuthUser>;
  updateNickname: (nickname: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  withdraw: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function readPendingSignUpEmail() {
  try {
    let email = window.sessionStorage.getItem(PENDING_SIGN_UP_EMAIL_KEY);
    if (!email) {
      email = window.sessionStorage.getItem(LEGACY_PENDING_SIGN_UP_EMAIL_KEY);
      if (email) {
        try {
          window.sessionStorage.setItem(PENDING_SIGN_UP_EMAIL_KEY, email);
          window.sessionStorage.removeItem(LEGACY_PENDING_SIGN_UP_EMAIL_KEY);
        } catch {
          // 저장소 마이그레이션이 실패해도 기존 가입 절차를 이어간다.
        }
      }
    }
    return email ? normalizeEmail(email) : null;
  } catch {
    return null;
  }
}

function savePendingSignUpEmail(email: string | null) {
  try {
    if (email) window.sessionStorage.setItem(PENDING_SIGN_UP_EMAIL_KEY, email);
    else {
      window.sessionStorage.removeItem(PENDING_SIGN_UP_EMAIL_KEY);
      window.sessionStorage.removeItem(LEGACY_PENDING_SIGN_UP_EMAIL_KEY);
    }
    window.dispatchEvent(new Event(PENDING_SIGN_UP_EMAIL_EVENT));
  } catch {
    // 인증 보조 정보는 API 세션에 남으므로 저장소 오류가 가입 절차를 막지 않는다.
  }
}

function subscribePendingSignUpEmail(onChange: () => void) {
  window.addEventListener(PENDING_SIGN_UP_EMAIL_EVENT, onChange);
  return () =>
    window.removeEventListener(PENDING_SIGN_UP_EMAIL_EVENT, onChange);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const pendingSignUpEmail = useSyncExternalStore(
    subscribePendingSignUpEmail,
    readPendingSignUpEmail,
    () => null,
  );

  useEffect(() => {
    let active = true;
    void getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const requestEmailVerification = useCallback(async (email: string) => {
    const result = await requestEmailVerificationApi(normalizeEmail(email));
    return result.resendAvailableInSeconds;
  }, []);

  const verifyEmailCode = useCallback(async (email: string, code: string) => {
    const normalizedEmail = normalizeEmail(email);
    const result = await verifyEmailCodeApi(normalizedEmail, code);
    if (result.kind === "signed-in") {
      setUser(result.user);
      savePendingSignUpEmail(null);
      return "signed-in" as const;
    }
    savePendingSignUpEmail(normalizedEmail);
    return "sign-up-required" as const;
  }, []);

  const signOut = useCallback(async () => {
    await signOutRequest();
    setUser(null);
    savePendingSignUpEmail(null);
  }, []);

  const register = useCallback(
    async (name: string, termsAgreed: boolean, privacyAgreed: boolean) => {
      const registeredUser = await signUpApi(
        name.trim(),
        termsAgreed,
        privacyAgreed,
      );
      setUser(registeredUser);
      savePendingSignUpEmail(null);
      return registeredUser;
    },
    [],
  );

  const updateNickname = useCallback(async (nickname: string) => {
    const nextUser = await updateProfile("nickname", nickname.trim());
    setUser(nextUser);
  }, []);

  const updateName = useCallback(async (name: string) => {
    const nextUser = await updateProfile("name", name.trim());
    setUser(nextUser);
  }, []);

  const withdraw = useCallback(async () => {
    await withdrawAccount();
    setUser(null);
    savePendingSignUpEmail(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      hydrated,
      pendingSignUpEmail,
      requestEmailVerification,
      verifyEmailCode,
      signOut,
      register,
      updateNickname,
      updateName,
      withdraw,
    }),
    [
      hydrated,
      pendingSignUpEmail,
      register,
      requestEmailVerification,
      signOut,
      updateName,
      updateNickname,
      user,
      verifyEmailCode,
      withdraw,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider가 필요합니다.");
  return context;
}
