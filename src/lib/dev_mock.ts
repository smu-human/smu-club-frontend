// src/lib/dev_mock.ts — VITE_MOCK_AUTH=true 일 때 API 인터셉터

import type {
  ApiWrapper, AuthMe, Club, ClubListItem, Question,
  Applicant, ApplicantDetail, MyPageName, MyPageProfile,
  ManagedClub, Application, ApplicationResult, UploadUrlItem,
} from "./types";

const IS_OWNER = import.meta.env.VITE_MOCK_USER_ROLE === "owner";

// ─── Mock 데이터 ──────────────────────────────────────────────
const MOCK_CLUB_ID = 1;

const MOCK_AUTH_ME: AuthMe = {
  operatorId: MOCK_CLUB_ID,
  name: IS_OWNER ? "Mock 관리자" : "Mock 회원",
  studentId: "20240001",
  email: "mock@smu.ac.kr",
  phone: "01012345678",
};

const MOCK_CLUB: Club = {
  id: MOCK_CLUB_ID,
  name: "SMU 개발 동아리",
  type: "CENTRAL",
  status: "OPEN",
  recruitingStatus: "OPEN",
  presidentName: "홍길동",
  contact: "01012345678",
  recruitDeadline: "2026-12-31",
  description: "<p>개발용 임시 동아리 소개입니다.</p>",
  title: "같이 개발해요",
  clubRoom: "공학관 401호",
  clubImages: [],
};

const MOCK_CLUBS: ClubListItem[] = [
  { id: 1, name: "SMU 개발 동아리", recruitingStatus: "OPEN", title: "함께 만들고 배우는 개발 모임", thumbnailUrl: "https://picsum.photos/seed/smu1/400/400" },
  { id: 2, name: "사진영상 크리에이터", recruitingStatus: "OPEN", title: "카메라로 담는 캠퍼스 라이프", thumbnailUrl: "https://picsum.photos/seed/smu2/400/400" },
  { id: 3, name: "밴드 소울메이트", recruitingStatus: "CLOSED", title: "록·인디·팝 장르의 공연 중심 밴드", thumbnailUrl: "https://picsum.photos/seed/smu3/400/400" },
];

const MOCK_MANAGED_CLUBS: ManagedClub[] = IS_OWNER
  ? [{ clubId: MOCK_CLUB_ID, name: "SMU 개발 동아리" }]
  : [];

const MOCK_APPLICATIONS: Application[] = [
  { applicationId: 101, status: "PENDING", appliedAt: "2026-08-01", clubId: 2, clubName: "사진영상 크리에이터" },
];

const MOCK_APPLICANTS: Applicant[] = [
  { applicationId: 201, applicantName: "김철수", status: "PENDING", appliedAt: "2026-08-10" },
  { applicationId: 202, applicantName: "이영희", status: "ACCEPTED", appliedAt: "2026-08-11" },
];

const MOCK_APPLICANT_DETAIL: ApplicantDetail = {
  applicationId: 201,
  clubId: MOCK_CLUB_ID,
  applicantName: "김철수",
  status: "PENDING",
  answers: [
    { questionId: 1, content: "백엔드 개발에 관심이 많습니다." },
    { questionId: 2, content: "Spring Boot, React를 사용할 수 있습니다." },
  ],
};

const MOCK_QUESTIONS: Question[] = [
  { id: 1, content: "지원 동기를 작성해 주세요.", type: "text", required: true, order: 0 },
  { id: 2, content: "보유 기술 스택을 작성해 주세요.", type: "text", required: false, order: 1 },
];

const MOCK_UPLOAD_URLS: UploadUrlItem[] = [
  { preSignedUrl: "https://mock-s3.example.com/upload/mock-file", fileName: "mock-image.jpg" },
];

// ─── Response 헬퍼 ────────────────────────────────────────────
function ok<T>(data: T): Response {
  const body: ApiWrapper<T> = { status: "SUCCESS", data };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── URL 라우터 ───────────────────────────────────────────────
export function mock_apiFetch(path: string | URL, init: RequestInit = {}): Response {
  const p = String(path);
  const method = (init.method ?? "GET").toUpperCase();

  // Auth
  if (p === "/auth/me" && method === "GET") return ok<AuthMe>(MOCK_AUTH_ME);
  if (p === "/auth/logout" && method === "POST") return ok(null);

  // Public clubs
  if (p === "/public/clubs" && method === "GET") return ok<ClubListItem[]>(MOCK_CLUBS);
  if (/^\/public\/clubs\/\d+$/.test(p) && method === "GET")
    return ok<Club>({ ...MOCK_CLUB, id: Number(p.split("/").pop()) });
  if (/^\/public\/clubs\/\d+\/application-form$/.test(p)) return ok<Question[]>(MOCK_QUESTIONS);
  if (/^\/public\/clubs\/\d+\/application\/session$/.test(p)) return ok(null);
  if (/^\/public\/clubs\/\d+\/applications$/.test(p)) return ok(null);

  // Member mypage
  if (p === "/member/mypage/name") return ok<MyPageName>({ name: MOCK_AUTH_ME.name });
  if (p === "/member/mypage/update" && method === "GET")
    return ok<MyPageProfile>({ email: MOCK_AUTH_ME.email, phoneNumber: MOCK_AUTH_ME.phone });
  if (p === "/member/mypage/update/phone" && method === "PUT") return ok(null);
  if (p === "/member/mypage/update/email" && method === "PUT") return ok(null);
  if (p === "/member/mypage/update/password" && method === "PUT") return ok(null);
  if (p === "/member/mypage/applications" && method === "GET") return ok<Application[]>(MOCK_APPLICATIONS);
  if (/^\/member\/mypage\/applications\/\d+\/result$/.test(p))
    return ok<ApplicationResult>({ clubName: "사진영상 크리에이터", status: "PENDING" });
  if (/^\/member\/mypage\/application\/\d+\/delete$/.test(p)) return ok(null);
  if (/^\/member\/mypage\/applications\/\d+\/update$/.test(p)) return ok(null);
  if (p === "/member/clubs/application/upload-url") return ok(MOCK_UPLOAD_URLS[0]);

  // Owner
  if (p === "/owner/club/managed-clubs") return ok<ManagedClub[]>(MOCK_MANAGED_CLUBS);
  if (p === "/owner/club/upload-urls") return ok<UploadUrlItem[]>(MOCK_UPLOAD_URLS);
  if (p === "/owner/clubs" && method === "POST") return ok(MOCK_CLUB);
  if (/^\/owner\/clubs\/\d+$/.test(p) && method === "GET")
    return ok<Club>({ ...MOCK_CLUB, id: Number(p.split("/").pop()) });
  if (/^\/owner\/clubs\/\d+$/.test(p) && method === "PUT") return ok<Club>(MOCK_CLUB);
  if (/^\/owner\/club\/\d+\/applicants$/.test(p)) return ok<Applicant[]>(MOCK_APPLICANTS);
  if (/^\/owner\/clubs\/\d+\/questions$/.test(p) && method === "GET") return ok<Question[]>(MOCK_QUESTIONS);
  if (/^\/owner\/clubs\/\d+\/questions$/.test(p) && method === "PUT") return ok(null);
  if (/^\/owner\/clubs\/\d+\/applications\/\d+$/.test(p))
    return ok<ApplicantDetail>({ ...MOCK_APPLICANT_DETAIL, applicationId: Number(p.split("/").pop()) });
  if (/^\/owner\/clubs\/\d+\/applications\/status$/.test(p)) return ok(null);
  if (/^\/owner\/club\/\d+\/applicants\/excel$/.test(p))
    return ok("https://mock-s3.example.com/export/applicants.xlsx");
  if (/^\/owner\/club\/email\/\d+$/.test(p)) return ok(null);

  // 파일 다운로드 URL 계열 (경로 패턴 다양, catch-all)
  if (p.includes("file-url") || p.includes("presigned")) return ok({ url: "https://mock-s3.example.com/download/mock" });

  // fallback
  console.warn(`[mock] 미등록 경로: ${method} ${p}`);
  return ok(null);
}
