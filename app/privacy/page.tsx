export default function PrivacyPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
      <h1 className="text-2xl font-bold">개인정보처리방침</h1>
      <div className="mt-8 space-y-8 text-sm leading-7 text-foreground/80">
        <section>
          <h2 className="font-semibold text-foreground">수집 항목</h2>
          <p className="mt-2">
            계정 기능에서는 방송대 이메일, 이름, 닉네임, 약관 동의 시각을
            사용합니다. 문제 풀이 답안과 선택한 카테고리는 학습 편의를 위해
            브라우저에 저장됩니다.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">이용 목적</h2>
          <p className="mt-2">
            학교 이메일 확인, 계정 제공, 문제 풀이 상태 복원에 사용합니다.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">브라우저 저장</h2>
          <p className="mt-2">
            브라우저에 저장된 학습 정보는 사용자가 브라우저 데이터를 삭제하면
            함께 삭제됩니다.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-foreground">보관과 삭제</h2>
          <p className="mt-2">
            계정 기능이 연결되면 서비스 제공에 필요한 기간 동안 정보를 보관하며,
            회원 탈퇴 요청 시 관련 정보를 삭제합니다.
          </p>
        </section>
      </div>
    </main>
  );
}
