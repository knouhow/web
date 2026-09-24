"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="mx-auto max-w-lg px-6 py-28 text-center">
      <h1 className="text-2xl font-bold">화면을 불러오지 못했어요.</h1>
      <p className="mt-3 text-muted-foreground">잠시 후 다시 시도해 주세요.</p>
      <button
        onClick={reset}
        className="mt-8 rounded-lg bg-primary px-6 py-3 text-primary-foreground"
      >
        다시 시도
      </button>
    </main>
  );
}
