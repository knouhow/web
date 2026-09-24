"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const mixer = pathname === "/mixer" || pathname.startsWith("/exam/mix_");
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-3 px-4 sm:px-8">
        <Link
          href="/"
          aria-label="방카이브 홈"
          className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <BookOpen className="size-5" />
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            방카이브<span className="text-primary">.</span>
          </span>
        </Link>
        <nav
          aria-label="주 메뉴"
          className="flex h-full gap-5 text-sm font-semibold sm:gap-8"
        >
          <Link
            href="/"
            aria-current={!mixer ? "page" : undefined}
            className={cn(
              "flex items-center border-b-2 px-1 transition-colors",
              !mixer
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            기말고사
          </Link>
          <Link
            href="/mixer"
            aria-current={mixer ? "page" : undefined}
            className={cn(
              "flex items-center border-b-2 px-1 transition-colors",
              mixer
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            기술 모의고사
          </Link>
        </nav>
        <Link
          href="/mixer"
          className="hidden items-center gap-1 text-xs font-medium text-muted-foreground lg:flex"
        >
          나만의 문제집 만들기 <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </header>
  );
}
