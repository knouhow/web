export default function TermsPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
      <h1 className="text-2xl font-bold">서비스 이용약관</h1>
      <div className="mt-8 space-y-8 text-sm leading-7 text-foreground/80">
        <section>
          <h2 className="font-semibold text-foreground">서비스 목적</h2>
          <p className="mt-2">
            노하우는 방송대 학습과 문제 풀이를 돕는 서비스입니다.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">계정</h2>
          <p className="mt-2">
            계정은 한국방송통신대학교 이메일(@knou.ac.kr) 인증을 마친
            이용자에게만 제공합니다.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">이용자 책임</h2>
          <p className="mt-2">
            이용자는 타인의 계정을 사용하거나 서비스 운영을 방해해서는 안
            됩니다.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">문항과 해설</h2>
          <p className="mt-2">
            서비스의 문항과 해설은 학습을 위한 자료이며, 시험 결과를 보장하지
            않습니다.
          </p>
        </section>
      </div>
    </main>
  );
}
