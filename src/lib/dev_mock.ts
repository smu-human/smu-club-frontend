// src/lib/dev_mock.ts
// VITE_DEV_MOCK=true 일 때 API 호출 대신 사용할 가짜 데이터
// 실제 백엔드 연동 시 이 파일과 api.ts의 DEV_MOCK 분기를 제거

import type { AuthMe, Club, ClubListItem } from "./types";

export const DEV_MOCK = import.meta.env.VITE_DEV_MOCK === "true";

export const MOCK_ME: AuthMe = {
  operatorId: 1,
  name: "개발 관리자",
  email: "dev@smu.ac.kr",
};

export const MOCK_CLUB: Club = {
  id: 1,
  name: "SMU 개발 동아리",
  type: "CENTRAL",
  status: "OPEN",
  recruitingStatus: "OPEN",
  presidentName: "홍길동",
  presidentPhone: "01012345678",
  recruitDeadline: "2026-12-31",
  startDate: "2026-07-01",
  endDate: "2026-12-31",
  description: "<p>개발용 임시 동아리 소개입니다.</p>",
  title: "같이 개발해요",
  clubRoom: "공학관 401호",
  contact: "01012345678",
};

export const MOCK_CLUBS: ClubListItem[] = [
  { id: 1, name: "SMU 개발 동아리", recruitingStatus: "OPEN",   title: "함께 만들고 배우는 개발 모임",        thumbnailUrl: "https://picsum.photos/seed/smu1/400/400" },
  { id: 2, name: "사진영상 크리에이터", recruitingStatus: "OPEN",   title: "카메라로 담는 캠퍼스 라이프",            thumbnailUrl: "https://picsum.photos/seed/smu2/400/400" },
  { id: 3, name: "밴드 소울메이트",    recruitingStatus: "CLOSED", title: "록·인디·팝 장르의 공연 중심 밴드 동아리", thumbnailUrl: "https://picsum.photos/seed/smu3/400/400" },
  { id: 4, name: "그린캠퍼스 환경단",  recruitingStatus: "OPEN",   title: "환경 보호와 지속가능한 캠퍼스 만들기",    thumbnailUrl: "https://picsum.photos/seed/smu4/400/400" },
  { id: 5, name: "독서토론 클럽",      recruitingStatus: "CLOSED", title: "한 달에 한 권, 깊이 읽고 함께 이야기해요", thumbnailUrl: "https://picsum.photos/seed/smu5/400/400" },
  { id: 6, name: "창업 스타트업 랩",   recruitingStatus: "OPEN",   title: "아이디어를 현실로 — 창업 스터디 & 프로젝트", thumbnailUrl: "https://picsum.photos/seed/smu6/400/400" },
];
