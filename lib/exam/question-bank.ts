import "server-only";
import type { AnswerIndex, CategoryId, Choices, Question } from "./types";

export interface BankQuestion extends Question {
  correctAnswer: AnswerIndex;
  explanation: string;
}
type Entry = readonly [string, Choices, AnswerIndex, string];

const cs: Entry[] = [
  [
    "운영체제에서 프로세스(Process)에 대한 설명으로 가장 적절한 것은?",
    [
      "디스크에 저장된 실행 파일 그 자체이다.",
      "실행 중인 프로그램으로, 독립적인 주소 공간을 갖는다.",
      "CPU의 연산 속도를 나타내는 단위이다.",
      "여러 프로그램이 공유하는 물리적 메모리이다.",
    ],
    1,
    "프로세스는 실행 중인 프로그램입니다. 운영체제는 각 프로세스의 주소 공간과 실행 상태를 관리합니다. 디스크의 실행 파일은 프로그램이며 실행 인스턴스인 프로세스와 구분합니다.",
  ],
  [
    "후입선출(LIFO) 방식으로 데이터를 관리하는 자료구조는?",
    ["큐(Queue)", "연결 리스트(Linked List)", "스택(Stack)", "힙(Heap)"],
    2,
    "스택은 가장 나중에 삽입한 항목을 먼저 꺼냅니다. 함수 호출 스택과 실행 취소 기능이 대표적인 활용입니다.",
  ],
  [
    "정렬된 배열에서 이진 탐색의 최악 시간 복잡도는?",
    ["O(log n)", "O(n)", "O(n log n)", "O(n²)"],
    0,
    "이진 탐색은 비교할 때마다 탐색 범위를 절반으로 줄이므로 최악의 경우에도 O(log n)번 비교합니다.",
  ],
  [
    "관계형 데이터베이스에서 기본 키(Primary Key)의 조건은?",
    [
      "중복을 허용한다.",
      "반드시 문자열이다.",
      "NULL만 저장한다.",
      "각 행을 유일하게 식별하며 NULL을 허용하지 않는다.",
    ],
    3,
    "기본 키는 유일성과 NOT NULL 조건을 만족하여 행을 식별합니다.",
  ],
  [
    "TCP의 특징으로 알맞은 것은?",
    [
      "연결 없이 데이터그램만 전송한다.",
      "신뢰성 있는 순서 보장 바이트 스트림을 제공한다.",
      "IP 주소를 도메인 이름으로 암호화한다.",
      "손실된 패킷을 재전송하지 않는다.",
    ],
    1,
    "TCP는 연결 지향 프로토콜로 순서 제어, 확인 응답과 재전송 등을 통해 신뢰성 있는 바이트 스트림을 제공합니다.",
  ],
  [
    "CPU 캐시가 주로 활용하는 프로그램의 성질은?",
    ["데이터 독립성", "교착 상태", "참조의 지역성", "정규화"],
    2,
    "캐시는 최근 접근한 데이터와 그 주변 데이터에 다시 접근할 가능성이 높은 시간적/공간적 지역성을 활용합니다.",
  ],
  [
    "선입선출(FIFO) 자료구조는?",
    ["큐", "스택", "이진 탐색 트리", "집합"],
    0,
    "큐는 먼저 들어온 항목을 먼저 꺼내는 선입선출 구조입니다.",
  ],
  [
    "다음 중 교착 상태의 필요조건이 아닌 것은?",
    ["상호 배제", "점유와 대기", "순환 대기", "자원 선점 가능"],
    3,
    "교착 상태의 네 필요조건은 상호 배제, 점유와 대기, 비선점, 순환 대기입니다.",
  ],
  [
    "IPv4 주소의 길이는?",
    ["16비트", "32비트", "64비트", "128비트"],
    1,
    "IPv4 주소는 32비트이며 흔히 8비트씩 네 부분으로 표기합니다. IPv6는 128비트입니다.",
  ],
  [
    "트랜잭션의 원자성(Atomicity)이 뜻하는 것은?",
    [
      "실행 시간을 일정하게 유지한다.",
      "모든 조회를 병렬로 실행한다.",
      "연산 전체가 수행되거나 전혀 수행되지 않는다.",
      "모든 테이블에 인덱스를 만든다.",
    ],
    2,
    "원자성은 트랜잭션을 하나의 단위로 취급하여 전체 반영 또는 전체 취소를 보장합니다.",
  ],
  [
    "너비 우선 탐색(BFS)에 일반적으로 사용하는 자료구조는?",
    ["큐", "스택", "해시 함수", "정렬 배열만 사용"],
    0,
    "BFS는 가까운 정점부터 방문하기 위해 발견한 정점을 큐에 넣고 순서대로 처리합니다.",
  ],
  [
    "HTTP 상태 코드 404가 의미하는 것은?",
    ["요청 성공", "영구 이동", "인증 필요", "리소스를 찾을 수 없음"],
    3,
    "404 Not Found는 서버가 요청한 리소스를 찾지 못했음을 나타냅니다.",
  ],
  [
    "데이터베이스 정규화의 주요 목적은?",
    [
      "모든 테이블을 하나로 합친다.",
      "중복과 갱신 이상을 줄인다.",
      "모든 외래 키를 제거한다.",
      "저장 용량을 반드시 늘린다.",
    ],
    1,
    "정규화는 종속성을 고려하여 테이블을 분해하고 삽입/수정/삭제 이상과 불필요한 중복을 줄입니다.",
  ],
  [
    "비트 연산 5 AND 3의 결과는?",
    ["7", "6", "1", "0"],
    2,
    "5는 이진수 101, 3은 011입니다. 같은 위치가 모두 1인 비트만 남기면 001, 즉 1입니다.",
  ],
  [
    "해시 충돌에 대한 설명으로 맞는 것은?",
    [
      "서로 다른 키가 같은 해시 값으로 매핑되는 것이다.",
      "동일한 키가 반드시 다른 값을 반환하는 것이다.",
      "정렬이 완료되었음을 뜻한다.",
      "메모리 용량이 무한함을 뜻한다.",
    ],
    0,
    "해시 함수의 출력 공간은 제한적이므로 서로 다른 입력이 같은 해시 값을 가질 수 있습니다.",
  ],
  [
    "DNS의 주된 역할은?",
    [
      "파일 압축",
      "프로세스 스케줄링",
      "데이터 암호화",
      "도메인 이름에 대한 IP 주소 등의 정보를 조회",
    ],
    3,
    "DNS는 도메인 이름을 계층적으로 관리하며 A/AAAA 등의 레코드로 IP 주소 정보를 제공합니다.",
  ],
  [
    "뮤텍스(Mutex)의 주된 용도는?",
    [
      "파일 확장자 변경",
      "임계 구역에 대한 상호 배제",
      "IP 주소 할당",
      "화면 해상도 조절",
    ],
    1,
    "뮤텍스는 공유 자원에 대한 임계 구역을 한 번에 하나의 실행 흐름만 사용하도록 보호합니다.",
  ],
  [
    "병합 정렬의 최악 시간 복잡도는?",
    ["O(1)", "O(n)", "O(n log n)", "O(n³)"],
    2,
    "병합 정렬은 log n 수준으로 분할하고 각 수준에서 O(n)의 병합 작업을 수행합니다.",
  ],
  [
    "SQL에서 집계 결과의 그룹을 필터링하는 절은?",
    ["HAVING", "ORDER BY", "SELECT", "FROM"],
    0,
    "HAVING은 GROUP BY 이후의 그룹에 조건을 적용합니다. WHERE는 그룹화 전의 행을 필터링합니다.",
  ],
  [
    "가상 메모리의 페이지 부재(Page Fault)는 언제 발생하는가?",
    [
      "모든 캐시가 비어 있을 때만",
      "프로그램을 컴파일할 때마다",
      "파일 이름이 중복될 때",
      "접근한 가상 페이지가 현재 메모리에 없을 때 등",
    ],
    3,
    "존재하는 가상 페이지가 물리 메모리에 올라와 있지 않을 때 페이지 부재가 발생하여 운영체제가 이를 처리합니다.",
  ],
  [
    "HTTPS가 HTTP에 더하는 주요 보안 계층은?",
    ["FTP", "TLS", "DNS", "ICMP"],
    1,
    "HTTPS는 TLS로 전송 구간의 기밀성/무결성과 서버 인증 등을 제공합니다.",
  ],
  [
    "이진 트리에서 각 노드가 가질 수 있는 자식의 최대 개수는?",
    ["1개", "3개", "2개", "제한 없음"],
    2,
    "이진 트리는 각 노드가 왼쪽과 오른쪽, 최대 두 자식을 갖는 트리입니다.",
  ],
  [
    "컴파일러의 주된 역할은?",
    [
      "소스 코드를 목적 코드 등 다른 표현으로 변환한다.",
      "네트워크 주소를 할당한다.",
      "모니터를 제어한다.",
      "모든 논리 오류를 자동 수정한다.",
    ],
    0,
    "컴파일러는 소스 언어로 작성한 코드를 목적 언어나 중간 표현으로 변환합니다. 모든 논리 오류를 검출하지는 못합니다.",
  ],
  [
    "외래 키(Foreign Key)가 주로 유지하는 무결성은?",
    ["시간 무결성", "화면 무결성", "파일 무결성", "참조 무결성"],
    3,
    "외래 키는 다른 테이블의 키와의 관계를 통해 참조 무결성을 유지합니다.",
  ],
  [
    "라운드 로빈(Round Robin) 스케줄링에 대한 설명으로 옳은 것은?",
    [
      "가장 긴 작업만 먼저 처리한다.",
      "각 프로세스에 일정 시간 할당량을 순환 배분한다.",
      "하나의 프로세스가 종료될 때까지 CPU를 독점한다.",
      "우선순위가 낮은 프로세스는 절대 실행하지 않는다.",
    ],
    1,
    "라운드 로빈은 준비 큐의 프로세스에 타임 퀀텀을 순서대로 배분하는 선점형 스케줄링입니다.",
  ],
];

const spring: Entry[] = [
  [
    "Spring의 DI(의존성 주입)가 의미하는 것은?",
    [
      "객체가 필요한 의존성을 외부에서 전달받는다.",
      "객체가 모든 의존성을 직접 생성한다.",
      "SQL을 자동 삭제한다.",
      "HTTP 연결을 압축한다.",
    ],
    0,
    "DI는 객체의 의존성 구성을 외부로 분리합니다. 생성자 주입은 필요한 의존성을 명확히 드러냅니다.",
  ],
  [
    "Spring IoC 컨테이너가 관리하는 객체를 무엇이라 하는가?",
    ["스레드", "빈(Bean)", "패킷", "테이블"],
    1,
    "Spring 컨테이너가 생성하고 구성하며 생명주기를 관리하는 객체를 빈이라고 합니다.",
  ],
  [
    "컴포넌트 스캔의 일반적인 대상 표시는?",
    ["@Override", "@Deprecated", "@Component", "@SafeVarargs"],
    2,
    "@Component는 클래스가 컴포넌트 스캔을 통해 빈으로 등록될 수 있음을 표시합니다.",
  ],
  [
    "Spring 빈의 기본 스코프는?",
    ["request", "session", "prototype", "singleton"],
    3,
    "기본 singleton 스코프는 빈 정의당 컨테이너별 하나의 인스턴스를 공유합니다.",
  ],
  [
    "설정 클래스의 메서드 반환 객체를 빈으로 등록하는 애너테이션은?",
    ["@Bean", "@Test", "@Entity", "@Id"],
    0,
    "@Bean 메서드는 Spring 컨테이너에 등록할 객체를 반환합니다.",
  ],
  [
    "REST 응답 본문 반환을 기본으로 하는 컨트롤러 애너테이션은?",
    ["@Repository", "@RestController", "@Configuration", "@Qualifier"],
    1,
    "@RestController는 @Controller와 @ResponseBody의 의미를 결합합니다.",
  ],
  [
    "HTTP GET 요청을 매핑하는 애너테이션은?",
    ["@PostMapping", "@PutMapping", "@GetMapping", "@DeleteMapping"],
    2,
    "@GetMapping은 GET 요청에 대한 핸들러 메서드를 선언합니다.",
  ],
  [
    "URL 경로 변수 /users/{id}를 바인딩하는 애너테이션은?",
    ["@RequestBody", "@Bean", "@Component", "@PathVariable"],
    3,
    "@PathVariable은 URI 템플릿의 변수 값을 메서드 매개변수에 바인딩합니다.",
  ],
  [
    "요청 본문 JSON을 객체로 읽는 데 사용하는 애너테이션은?",
    ["@RequestBody", "@ResponseStatus", "@Service", "@Scope"],
    0,
    "@RequestBody는 HttpMessageConverter를 통해 요청 본문을 지정한 타입으로 변환합니다.",
  ],
  [
    "쿼리 문자열 ?page=2 값을 바인딩하는 애너테이션은?",
    ["@PathVariable", "@RequestParam", "@Primary", "@Lazy"],
    1,
    "@RequestParam은 요청 파라미터를 핸들러 메서드의 매개변수에 바인딩합니다.",
  ],
  [
    "서비스 계층을 표현하는 대표적인 스테레오타입은?",
    ["@Entity", "@Table", "@Service", "@Column"],
    2,
    "@Service는 서비스 계층 컴포넌트를 나타내는 @Component의 특수화입니다.",
  ],
  [
    "데이터 접근 계층에 사용하는 스테레오타입은?",
    ["@Controller", "@Configuration", "@ResponseBody", "@Repository"],
    3,
    "@Repository는 데이터 접근 계층을 나타내며 예외 변환과 연계될 수 있습니다.",
  ],
  [
    "같은 타입의 후보 중 주입할 빈을 구분하는 애너테이션은?",
    ["@Qualifier", "@GetMapping", "@RequestBody", "@Id"],
    0,
    "@Qualifier는 여러 주입 후보 가운데 특정 후보를 좁히는 데 사용합니다.",
  ],
  [
    "같은 타입의 빈 중 우선 후보를 지정하는 애너테이션은?",
    ["@Lazy", "@Primary", "@Scope", "@Value"],
    1,
    "@Primary는 단일 의존성 주입 시 여러 후보 중 우선 선택할 빈을 표시합니다.",
  ],
  [
    "선언적 트랜잭션 경계를 표시하는 애너테이션은?",
    ["@Async", "@Order", "@Transactional", "@Profile"],
    2,
    "@Transactional은 메서드나 클래스의 트랜잭션 속성을 선언합니다.",
  ],
  [
    "기본 프록시 방식에서 같은 객체 내부의 @Transactional 메서드 직접 호출은?",
    [
      "항상 새 트랜잭션을 만든다.",
      "무조건 컴파일 오류이다.",
      "별도 스레드로 실행된다.",
      "프록시를 거치지 않아 해당 호출의 트랜잭션 조언이 적용되지 않는다.",
    ],
    3,
    "self-invocation은 프록시 외부 호출을 거치지 않으므로 기본 프록시 기반 트랜잭션 조언이 적용되지 않습니다.",
  ],
  [
    "Spring MVC의 프런트 컨트롤러는?",
    [
      "DispatcherServlet",
      "EntityManager",
      "DataSource",
      "BeanFactoryPostProcessor",
    ],
    0,
    "DispatcherServlet은 요청을 받고 적절한 핸들러로 전달하는 중심 서블릿입니다.",
  ],
  [
    "여러 컨트롤러의 예외 처리를 공통화할 때 사용하는 것은?",
    ["@ComponentScan만", "@ControllerAdvice", "@Id", "@GeneratedValue"],
    1,
    "@ControllerAdvice와 @ExceptionHandler를 사용해 공통 예외 처리 등을 구현할 수 있습니다.",
  ],
  [
    "외부 설정값을 타입이 있는 객체에 묶는 Spring Boot 애너테이션은?",
    [
      "@ResponseBody",
      "@PathVariable",
      "@ConfigurationProperties",
      "@DeleteMapping",
    ],
    2,
    "@ConfigurationProperties는 공통 접두사를 갖는 외부 속성을 객체에 바인딩합니다.",
  ],
  [
    "환경별 빈 구성을 활성화하는 애너테이션은?",
    ["@Bean만", "@Autowired만", "@Order", "@Profile"],
    3,
    "@Profile은 지정된 프로파일이 활성화될 때 해당 빈 구성이 적용되도록 합니다.",
  ],
  [
    "Spring AOP의 대표 활용 사례는?",
    [
      "로깅/트랜잭션 같은 공통 관심사 분리",
      "모든 SQL 문법 제거",
      "JVM 대체",
      "운영체제 부팅",
    ],
    0,
    "AOP는 여러 모듈에 걸친 공통 관심사를 분리하여 중복을 줄입니다.",
  ],
  [
    "prototype 스코프 빈의 기본 생성 동작은?",
    [
      "서버 전체에서 영원히 하나",
      "컨테이너에 요청할 때 새 인스턴스 생성",
      "HTTP 세션마다 정확히 하나",
      "브라우저 탭마다 하나",
    ],
    1,
    "prototype 빈은 컨테이너에서 조회할 때마다 새 인스턴스를 생성합니다. singleton에 주입할 때 자동으로 매번 새로 생성되는 것은 아닙니다.",
  ],
  [
    "생성자 주입의 장점으로 알맞은 것은?",
    [
      "순환 의존성을 무조건 해결한다.",
      "테스트가 불가능해진다.",
      "필수 의존성을 명확히 하고 불변 필드를 활용하기 쉽다.",
      "빈 등록이 불필요해진다.",
    ],
    2,
    "생성자 주입은 의존성을 명시하고 final 필드를 사용할 수 있어 객체 구성과 테스트에 유리합니다.",
  ],
  [
    "Spring Boot 자동 구성의 주된 역할은?",
    [
      "모든 업무 로직 작성",
      "데이터베이스의 모든 행 삭제",
      "자바 문법 변경",
      "클래스패스와 설정 등의 조건에 따라 구성을 제공",
    ],
    3,
    "자동 구성은 사용 중인 라이브러리와 기존 빈 등의 조건을 바탕으로 기본 구성을 제공합니다.",
  ],
  [
    "@Transactional의 기본 전파 속성 REQUIRED는?",
    [
      "기존 트랜잭션에 참여하고, 없으면 새로 만든다.",
      "항상 기존 트랜잭션을 중단한다.",
      "트랜잭션을 금지한다.",
      "항상 중첩 저장점을 만든다.",
    ],
    0,
    "REQUIRED는 실행 중인 트랜잭션이 있으면 참여하고 없으면 새 트랜잭션을 시작합니다.",
  ],
];

function numericEntry(
  text: string,
  correct: number,
  explanation: string,
  position: AnswerIndex,
): Entry {
  const values = [correct + 1, correct + 2, correct + 3, correct + 4];
  values[position] = correct;
  return [
    text,
    [
      String(values[0]),
      String(values[1]),
      String(values[2]),
      String(values[3]),
    ],
    position,
    explanation,
  ];
}

const java: Entry[] = Array.from({ length: 25 }, (_, index) => {
  const n = Math.floor(index / 5) + 2;
  const position = (index % 4) as AnswerIndex;
  switch (index % 5) {
    case 0:
      return numericEntry(
        `Java에서 정수식 ${n * 3 + 1} / 3의 결과는?`,
        n,
        "두 피연산자가 정수인 나눗셈은 소수 부분을 버리고 정수 결과를 반환합니다.",
        position,
      );
    case 1:
      return numericEntry(
        `Java에서 ${n * 4 + 2} % 4의 결과는?`,
        2,
        "% 연산자는 정수 나눗셈의 나머지를 반환합니다.",
        position,
      );
    case 2:
      return numericEntry(
        `Java에서 int x = ${n}; int y = x++; 실행 후 y의 값은?`,
        n,
        "후위 증가 연산자는 증가 이전 값을 식의 값으로 사용한 후 변수를 1 증가시킵니다.",
        position,
      );
    case 3:
      return numericEntry(
        `Java에서 new int[${n + 3}].length의 값은?`,
        n + 3,
        "배열의 length 필드는 배열을 생성할 때 지정한 원소 개수입니다.",
        position,
      );
    default:
      return numericEntry(
        `Java에서 int sum = 0; for (int i = 1; i <= ${n}; i++) sum += i; 실행 후 sum은?`,
        (n * (n + 1)) / 2,
        `1부터 ${n}까지의 합은 n(n+1)/2를 적용하여 ${(n * (n + 1)) / 2}입니다.`,
        position,
      );
  }
});

const python: Entry[] = Array.from({ length: 25 }, (_, index) => {
  const n = Math.floor(index / 5) + 2;
  const position = (index % 4) as AnswerIndex;
  switch (index % 5) {
    case 0:
      return numericEntry(
        `Python 3에서 len(range(${n + 3}))의 값은?`,
        n + 3,
        "range(stop)은 0부터 stop 미만까지의 정수를 생성하므로 양수 stop개 원소를 가집니다.",
        position,
      );
    case 1:
      return numericEntry(
        `Python 3에서 ${n * 3 + 1} // 3의 값은?`,
        n,
        "//는 나눗셈 결과에 내림을 적용하는 연산자입니다.",
        position,
      );
    case 2:
      return numericEntry(
        `Python 3에서 len([10, 20, 30, 40, 50, 60, 70, 80][:${n}])의 값은?`,
        n,
        "슬라이스 [:n]은 처음부터 인덱스 n 미만까지의 원소를 선택합니다.",
        position,
      );
    case 3:
      return numericEntry(
        `Python 3에서 sum(range(1, ${n + 1}))의 값은?`,
        (n * (n + 1)) / 2,
        `range의 끝값은 제외됩니다. 1부터 ${n}까지 더합니다.`,
        position,
      );
    default:
      return numericEntry(
        `Python 3에서 2 ** ${n}의 값은?`,
        2 ** n,
        "**는 거듭제곱 연산자입니다.",
        position,
      );
  }
});

function makeBank(category: CategoryId, entries: Entry[]): BankQuestion[] {
  return entries.map(([text, choices, correctAnswer, explanation], index) => ({
    id: `${category}-${index + 1}`,
    category,
    text,
    choices,
    correctAnswer,
    explanation,
  }));
}

export const questionBank: Record<CategoryId, BankQuestion[]> = {
  cs: makeBank("cs", cs),
  java: makeBank("java", java),
  python: makeBank("python", python),
  spring: makeBank("spring", spring),
};
