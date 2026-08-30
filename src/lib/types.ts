// src/lib/types.ts — 프로젝트 공통 타입 정의

// ===== API 공통 래퍼 =====
export interface ApiWrapper<T> {
  status: string;
  data: T;
  message?: string;
  errorCode?: string;
}

// ===== 인증 =====
export interface AuthMe {
  operatorId: number;
  name: string;
  studentId?: string;
  email?: string;
  phone?: string;
}

export interface AuthTokenData {
  accessToken: string;
  refreshToken: string;
}

// ===== 동아리 =====
export interface ClubImage {
  imageUrl: string;
  orderNumber?: number;
}

/**
 * 동아리 구분. 백엔드 ClubType enum과 1:1로 대응하며, 전송값은 반드시 이 문자열이어야 한다
 * (다른 값은 백엔드에서 400). 표시용 한글 라벨은 CLUB_TYPE_OPTIONS를 쓴다.
 */
export type ClubTypeValue = "CENTRAL" | "ETC";

export const DEFAULT_CLUB_TYPE: ClubTypeValue = "CENTRAL";

export const CLUB_TYPE_OPTIONS: ReadonlyArray<{ value: ClubTypeValue; label: string }> = [
  { value: "CENTRAL", label: "중앙동아리" },
  { value: "ETC", label: "그 외 동아리" },
];

/** 백엔드가 내려준 값이 알 수 없는 문자열이어도 셀렉트가 깨지지 않도록 보정한다. */
export function to_club_type(value: unknown): ClubTypeValue {
  return CLUB_TYPE_OPTIONS.some((o) => o.value === value)
    ? (value as ClubTypeValue)
    : DEFAULT_CLUB_TYPE;
}

export interface Club {
  id: number;
  name: string;
  type?: string;
  status?: string;
  recruitingStatus?: string;
  recruitStatus?: string;
  startDate?: string | null;
  endDate?: string | null;
  recruitingStart?: string | null;
  recruitingEnd?: string | null;
  recruitStart?: string | null;
  recruitStartAt?: string | null;
  recruitingStartAt?: string | null;
  description?: string;
  title?: string;
  presidentName?: string;
  presidentPhone?: string;
  president?: string;
  contact?: string;
  clubRoom?: string;
  thumbnailUrl?: string;
  recruitDeadline?: string | null;
  uploadedImageFileNames?: string[];
  clubImages?: ClubImage[];
  // 모집 시작 여부 플래그 (API 키 불확실, 여러 케이스 대응)
  recruitingStarted?: boolean;
  isRecruitingStarted?: boolean;
  recruitStarted?: boolean;
  isRecruitStarted?: boolean;
  isRecruiting?: boolean;
  recruitingOpen?: boolean;
}

export interface ClubListItem {
  id: number;
  name: string;
  recruitingStatus?: string;
  title?: string;
  thumbnailUrl?: string;
  /** 목록은 백엔드가 중앙동아리 우선으로 정렬해 내려준다. 프론트에서 재정렬하지 않는다. */
  type?: ClubTypeValue;
}

// ===== 지원서 질문/답변 =====
export interface Question {
  id: number;
  content: string;
  type: string;
  required?: boolean;
  order?: number;
  questionId?: number;
  questionContent?: string;
  questionType?: string;
}

export interface Answer {
  questionId: number;
  content: string;
  fileKey?: string;
  fileUrl?: string;
  originalFileName?: string;
}

export interface FileAttachment {
  questionId: number;
  fileKey: string;
  originalFileName?: string;
  fileUrl?: string;
}

// ===== 지원자 =====
export interface Applicant {
  applicationId: number;
  applicantName?: string;
  name?: string;
  status: string;
  appliedAt?: string;
  clubId?: number;
  clubName?: string;
}

export interface ApplicantDetail {
  applicationId: number;
  clubId?: number;
  clubMemberId?: number;
  applicantName?: string;
  name?: string;
  status: string;
  answers?: Answer[];
  files?: FileAttachment[];
  questions?: Question[];
}

// ===== 마이페이지 =====
export interface MyPageName {
  name: string;
}

export interface MyPageProfile {
  memberId?: number;
  email?: string;
  phoneNumber?: string;
}

export interface ManagedClub {
  id?: number;
  clubId?: number;
  club_id?: number;
  name?: string;
  clubName?: string;
  club?: { id?: number; clubId?: number; name?: string; clubName?: string };
  clubInfo?: { id?: number; clubId?: number; name?: string; clubName?: string };
}

export interface Application {
  applicationId?: number;
  applyId?: number;
  memberId?: number;
  status?: string;
  applicationStatus?: string;
  applyStatus?: string;
  appliedAt?: string;
  clubId?: number;
  club_id?: number;
  clubName?: string;
  club?: { id?: number; clubId?: number; name?: string; clubName?: string; club_id?: number };
  clubInfo?: { id?: number; clubId?: number; name?: string; clubName?: string };
  application?: { clubId?: number; club_id?: number };
  club_id_fk?: number;
  president?: string;
  contact?: string;
  recruitingEnd?: string;
  clubRoom?: string;
  description?: string;
}

// ===== 지원 결과 =====
export interface ApplicationResult {
  clubName?: string;
  status?: string;
}

// ===== 업로드 =====
export interface UploadUrlItem {
  preSignedUrl: string;
  fileName: string;
}

// ===== 에러 =====
export interface ApiErrorData {
  status?: string;
  message?: string;
  errorCode?: string;
}

export class ApiError extends Error {
  code: string;
  status: number;
  raw: ApiErrorData | null;

  constructor(message: string, code: string, status: number, raw: ApiErrorData | null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.raw = raw;
  }
}

// ===== 동아리 등록/수정 payload =====
export interface ClubPayload {
  name?: string;
  presidentName?: string;
  presidentPhone?: string;
  recruitDeadline?: string | null;
  description?: string;
  type?: string;
  uploadedImageFileNames?: string[];
  title?: string;
  president?: string;
  contact?: string;
  recruitingEnd?: string | null;
  clubRoom?: string;
}

// ===== 지원서 제출 =====
export interface ApplicationPayload {
  answers?: Answer[];
  files?: FileAttachment[];
  [key: string]: unknown;
}
