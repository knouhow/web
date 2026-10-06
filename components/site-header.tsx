"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { LoginDialog } from "@/components/auth/login-dialog";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/toast-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface HeaderUser {
  nickname: string;
}

interface SiteHeaderProps {
  user?: HeaderUser;
}

function AccountMenu({
  user,
  onSignOut,
}: {
  user: HeaderUser;
  onSignOut: () => void;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${user.nickname} 메뉴`}
          className="flex items-center gap-1.5 rounded-lg p-1 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary sm:pr-2"
        >
          <Avatar>
            <AvatarFallback>{user.nickname.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-24 truncate text-xs font-semibold sm:block">
            {user.nickname}
          </span>
          <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/mypage">
            <UserRound />
            마이페이지
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            설정
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={onSignOut}
        >
          <LogOut />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SiteHeader({ user }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: authenticatedUser, signOut } = useAuth();
  const { error: showError, info } = useToast();
  const [loginOpen, setLoginOpen] = useState(false);
  const exam = pathname === "/" || pathname.startsWith("/exam/knou-");
  const isSigningUp = pathname === "/signup";
  const headerUser = user ?? authenticatedUser;

  function handleSignOut() {
    void signOut()
      .then(() => router.replace("/"))
      .catch((signOutError: unknown) => {
        showError({
          title: "로그아웃하지 못했습니다.",
          description:
            signOutError instanceof ApiError ? signOutError.message : undefined,
        });
      });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-4 sm:px-8">
        <Link
          href="/"
          aria-label="KNOUHow 홈"
          className="justify-self-start rounded-md text-base font-extrabold tracking-tight focus-visible:outline-2 focus-visible:outline-primary sm:text-xl"
        >
          KNOUHow
        </Link>

        <nav
          aria-label="주요 메뉴"
          className="flex h-full items-stretch justify-self-center gap-2 text-xs font-semibold sm:gap-5 sm:text-sm"
        >
          <Link
            href="/"
            aria-current={exam ? "page" : undefined}
            className={cn(
              "flex items-center border-b-2 px-0.5 transition-colors sm:px-1",
              exam
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            기출문제
          </Link>
          <button
            type="button"
            onClick={() => info({ title: "서비스 준비 중입니다." })}
            className="flex items-center border-b-2 border-transparent px-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary sm:px-1"
          >
            학습
          </button>
        </nav>

        {!isSigningUp && (
          <div className="justify-self-end">
            {headerUser ? (
              <AccountMenu user={headerUser} onSignOut={handleSignOut} />
            ) : (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="flex h-8 items-center rounded-lg border border-border px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
              >
                로그인
              </button>
            )}
          </div>
        )}
      </div>
      {!isSigningUp && !headerUser && (
        <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      )}
    </header>
  );
}
