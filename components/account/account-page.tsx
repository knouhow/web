"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import type { AuthUser } from "@/lib/auth/client";
import { ApiError } from "@/lib/api-client";
import { useToast } from "@/components/toast-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AccountPageKind = "mypage" | "settings";

interface AccountPageProps {
  kind: AccountPageKind;
}

function MyProfile({ user }: { user: AuthUser }) {
  const { updateNickname } = useAuth();
  const { error: showError, success } = useToast();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(user.nickname);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="text-lg">
            {user.nickname.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{user.nickname}</p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {user.email}
          </p>
        </div>
      </div>

      {editing ? (
        <form
          className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            if (!nickname.trim()) return;
            setIsSaving(true);
            void updateNickname(nickname)
              .then(() => {
                success({ title: "닉네임을 수정했습니다." });
                setEditing(false);
              })
              .catch((saveError: unknown) => {
                showError({
                  title: "닉네임을 수정하지 못했습니다.",
                  description:
                    saveError instanceof ApiError
                      ? saveError.message
                      : undefined,
                });
              })
              .finally(() => setIsSaving(false));
          }}
        >
          <div className="flex-1 space-y-2">
            <label htmlFor="nickname" className="text-sm font-semibold">
              닉네임
            </label>
            <Input
              id="nickname"
              value={nickname}
              maxLength={20}
              required
              onChange={(event) => setNickname(event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "저장 중" : "저장"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNickname(user.nickname);
                setEditing(false);
              }}
            >
              취소
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="mt-6"
          onClick={() => setEditing(true)}
        >
          수정
        </Button>
      )}
    </section>
  );
}

function AccountSettings({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { updateName, withdraw } = useAuth();
  const { error: showError, success } = useToast();
  const [name, setName] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <dl className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-center">
          <dt className="text-sm text-muted-foreground">이메일</dt>
          <dd className="flex h-11 min-w-0 items-center rounded-xl border border-input bg-secondary px-3 py-1 text-sm text-muted-foreground">
            {user.email}
          </dd>
        </div>
        <div className="grid gap-2 sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-center">
          <dt>
            <label htmlFor="name" className="text-sm text-muted-foreground">
              이름
            </label>
          </dt>
          <dd className="min-w-0">
            <form
              className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center"
              onSubmit={(event) => {
                event.preventDefault();
                if (!name.trim()) return;
                setIsSaving(true);
                void updateName(name)
                  .then(() => success({ title: "이름을 수정했습니다." }))
                  .catch((saveError: unknown) => {
                    showError({
                      title: "이름을 수정하지 못했습니다.",
                      description:
                        saveError instanceof ApiError
                          ? saveError.message
                          : undefined,
                    });
                  })
                  .finally(() => setIsSaving(false));
              }}
            >
              <Input
                id="name"
                value={name}
                maxLength={30}
                required
                className="sm:flex-1"
                onChange={(event) => setName(event.target.value)}
              />
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "저장 중" : "저장"}
              </Button>
            </form>
          </dd>
        </div>
      </dl>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="destructive" className="mt-8">
            회원 탈퇴
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>회원 탈퇴</AlertDialogTitle>
            <AlertDialogDescription>
              탈퇴하면 계정을 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isWithdrawing}
              onClick={() => {
                setIsWithdrawing(true);
                void withdraw()
                  .then(() => {
                    success({ title: "회원 탈퇴가 완료되었습니다." });
                    router.replace("/");
                  })
                  .catch((withdrawError: unknown) => {
                    showError({
                      title: "회원 탈퇴를 처리하지 못했습니다.",
                      description:
                        withdrawError instanceof ApiError
                          ? withdrawError.message
                          : undefined,
                    });
                  })
                  .finally(() => setIsWithdrawing(false));
              }}
            >
              {isWithdrawing ? "탈퇴 중" : "회원 탈퇴"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export function AccountPage({ kind }: AccountPageProps) {
  const router = useRouter();
  const { user, hydrated } = useAuth();

  useEffect(() => {
    if (hydrated && !user) router.replace("/");
  }, [hydrated, router, user]);

  if (!hydrated || !user) {
    return <main id="main-content" className="min-h-72" aria-busy="true" />;
  }

  return (
    <main
      id="main-content"
      className="mx-auto min-h-72 max-w-3xl px-4 py-12 sm:px-8"
    >
      <h1 className="text-2xl font-bold">
        {kind === "mypage" ? "마이페이지" : "설정"}
      </h1>
      {kind === "mypage" ? (
        <MyProfile user={user} />
      ) : (
        <AccountSettings user={user} />
      )}
    </main>
  );
}
