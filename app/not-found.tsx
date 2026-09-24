import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto max-w-lg px-6 py-28 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-3 text-2xl font-bold">시험을 찾을 수 없어요.</h1>
      <p className="mt-3 text-muted-foreground">
        주소를 확인하거나 새 모의고사를 만들어 주세요.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-lg bg-primary px-6 py-3 text-primary-foreground"
      >
        기말고사로 돌아가기
      </Link>
    </main>
  );
}
