"use client";

import { useState } from "react";
import Link from "next/link";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";

export function SiteFooter() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-6 text-center text-xs text-muted-foreground sm:px-8">
        <nav
          aria-label="서비스 정보"
          className="flex flex-wrap justify-center gap-x-4 gap-y-2"
        >
          <Link href="/privacy" className="hover:text-foreground">
            개인정보처리방침
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            서비스 이용약관
          </Link>
          <button
            type="button"
            onClick={() => setFeedbackOpen(true)}
            className="hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            서비스 피드백
          </button>
        </nav>
        <p>© 2026 KNOUHow</p>
      </div>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </footer>
  );
}
