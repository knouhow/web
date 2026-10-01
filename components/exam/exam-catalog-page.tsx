"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchSubjects, subjectsQueryKey } from "@/lib/exam/client";
import type { SubjectCatalogItem } from "@/lib/exam/subjects";

const PAGE_SIZE = 10;
const SUBJECT_TITLE_COLLATOR = new Intl.Collator("ko-KR");

function startsWithEnglish(title: string) {
  return /^[A-Za-z]/.test(title.trim());
}

function compareSubjectTitle(
  left: SubjectCatalogItem,
  right: SubjectCatalogItem,
) {
  const leftStartsWithEnglish = startsWithEnglish(left.title);
  const rightStartsWithEnglish = startsWithEnglish(right.title);
  if (leftStartsWithEnglish !== rightStartsWithEnglish)
    return leftStartsWithEnglish ? -1 : 1;
  return SUBJECT_TITLE_COLLATOR.compare(left.title, right.title);
}

const LOCAL_MOCK_SUBJECTS: readonly SubjectCatalogItem[] = [
  {
    id: -1,
    code: "local-c-programming",
    title: "C프로그래밍",
    department: "컴퓨터과학과",
    pastExams: [],
  },
  {
    id: -2,
    code: "local-data-structures",
    title: "자료구조",
    department: "컴퓨터과학과",
    pastExams: [],
  },
  {
    id: -3,
    code: "local-operating-systems",
    title: "운영체제",
    department: "컴퓨터과학과",
    pastExams: [],
  },
  {
    id: -4,
    code: "local-databases",
    title: "데이터베이스시스템",
    department: "컴퓨터과학과",
    pastExams: [],
  },
  {
    id: -5,
    code: "local-algorithms",
    title: "알고리즘",
    department: "컴퓨터과학과",
    pastExams: [],
  },
  {
    id: -6,
    code: "local-computer-security",
    title: "컴퓨터보안",
    department: "컴퓨터과학과",
    pastExams: [],
  },
  {
    id: -7,
    code: "local-computer-networks",
    title: "컴퓨터네트워크",
    department: "컴퓨터과학과",
    pastExams: [],
  },
  {
    id: -8,
    code: "local-software-engineering",
    title: "소프트웨어공학",
    department: "컴퓨터과학과",
    pastExams: [],
  },
  {
    id: -9,
    code: "local-artificial-intelligence",
    title: "인공지능",
    department: "컴퓨터과학과",
    pastExams: [],
  },
  {
    id: -10,
    code: "local-web-programming",
    title: "웹프로그래밍",
    department: "컴퓨터과학과",
    pastExams: [],
  },
  {
    id: -11,
    code: "local-mobile-app-programming",
    title: "모바일앱프로그래밍",
    department: "컴퓨터과학과",
    pastExams: [],
  },
];

export function ExamCatalogPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const subjectsQuery = useQuery({
    queryKey: subjectsQueryKey,
    queryFn: ({ signal }) => fetchSubjects(signal),
  });
  const subjects = subjectsQuery.data;
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLocaleLowerCase("ko-KR");
  const catalogSubjects = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_APP_ENV === "local" &&
      process.env.NEXT_PUBLIC_USE_SUBJECT_MOCKS === "true"
        ? [...(subjects ?? []), ...LOCAL_MOCK_SUBJECTS]
        : [...(subjects ?? [])]
      ).sort(compareSubjectTitle),
    [subjects],
  );
  const filteredSubjects = useMemo(
    () =>
      catalogSubjects.filter((subject) =>
        `${subject.title} ${subject.department}`
          .toLocaleLowerCase("ko-KR")
          .includes(normalizedQuery),
      ),
    [catalogSubjects, normalizedQuery],
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubjects.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const pagedSubjects = filteredSubjects.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    const prefix = "#subject-";
    if (!window.location.hash.startsWith(prefix)) return;
    const subjectId = decodeURIComponent(
      window.location.hash.slice(prefix.length),
    );
    if (!catalogSubjects.some((subject) => subject.code === subjectId)) return;
    const target = document.querySelector<HTMLDetailsElement>(
      `#subject-${subjectId}`,
    );
    if (!target) return;
    target.open = true;
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "instant", block: "center" });
      target.querySelector("summary")?.focus({ preventScroll: true });
    });
  }, [catalogSubjects]);

  return (
    <main
      id="main-content"
      className="mx-auto max-w-7xl px-4 pt-6 pb-12 sm:px-8 sm:pt-8 sm:pb-18"
    >
      <h1 className="sr-only">기말고사 과목</h1>
      <section
        className="mx-auto max-w-2xl"
        aria-labelledby="subject-list-title"
      >
        <p className="mb-3 text-center text-sm font-medium text-muted-foreground">
          기출문제 저작권은{" "}
          <a
            href="https://www.knou.ac.kr/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-3 hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            한국방송통신대학교
          </a>
          {"에 있습니다."}
        </p>
        <label htmlFor="subject-search" className="sr-only">
          과목 검색
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="subject-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="과목명으로 검색"
            className="pl-11"
          />
        </div>

        <div className="mt-10">
          <h2 id="subject-list-title" className="text-sm font-bold">
            과목 목록
          </h2>
        </div>

        {subjectsQuery.isPending ? (
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            과목 목록을 불러오는 중입니다.
          </p>
        ) : subjectsQuery.isError ? (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm"
          >
            <p>과목 목록을 불러오지 못했습니다.</p>
            <Button
              type="button"
              variant="link"
              className="mt-1 h-auto p-0"
              onClick={() => void subjectsQuery.refetch()}
            >
              다시 시도
            </Button>
          </div>
        ) : filteredSubjects.length ? (
          <>
            <ul className="mt-4 grid gap-3">
              {pagedSubjects.map((subject) => (
                <li key={subject.code}>
                  <details
                    id={`subject-${subject.code}`}
                    className="group rounded-2xl border border-border bg-card"
                    onToggle={(event) => {
                      const url = new URL(window.location.href);
                      url.hash = event.currentTarget.open
                        ? `#subject-${subject.code}`
                        : "";
                      window.history.replaceState(
                        window.history.state,
                        "",
                        `${url.pathname}${url.search}${url.hash}`,
                      );
                    }}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-left font-bold outline-none transition-colors hover:bg-primary/[0.025] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
                      {subject.title}
                      <ChevronDown
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                      />
                    </summary>
                    {subject.pastExams.length ? (
                      <div className="border-t border-border px-5 py-3">
                        <ul aria-label={`${subject.title} 연도별 기출문제`}>
                          {subject.pastExams.map((pastExam) => (
                            <li key={pastExam.examId}>
                              <a
                                href={`/exam/${pastExam.examId}`}
                                onClick={(event) => {
                                  if (
                                    event.button !== 0 ||
                                    event.metaKey ||
                                    event.ctrlKey ||
                                    event.shiftKey ||
                                    event.altKey
                                  )
                                    return;
                                  window.history.pushState(
                                    window.history.state,
                                    "",
                                    `${window.location.pathname}${window.location.search}${window.location.hash}`,
                                  );
                                }}
                                className="block rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
                              >
                                {pastExam.examYear}년 {pastExam.termLabel}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="border-t border-border px-5 py-3 text-sm text-muted-foreground">
                        등록된 기출문제가 없습니다.
                      </p>
                    )}
                  </details>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <nav
                aria-label="과목 목록 페이지"
                className="mt-6 flex items-center justify-center gap-1"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="이전 페이지"
                  disabled={currentPage === 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  이전
                </Button>
                {Array.from({ length: totalPages }, (_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <Button
                      key={pageNumber}
                      type="button"
                      variant={
                        pageNumber === currentPage ? "secondary" : "outline"
                      }
                      size="sm"
                      aria-label={`${pageNumber}페이지`}
                      aria-current={
                        pageNumber === currentPage ? "page" : undefined
                      }
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="다음 페이지"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  다음
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="맨 끝 페이지"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(totalPages)}
                >
                  맨 끝
                </Button>
              </nav>
            )}
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-center">
            <p className="font-semibold">
              {normalizedQuery
                ? "검색 결과가 없습니다."
                : "등록된 과목이 없습니다."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
