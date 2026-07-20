// src/lib/api.ts

import type {
  ApiWrapper,
  AuthMe,
  AuthTokenData,
  Club,
  ClubListItem,
  Question,
  Applicant,
  ApplicantDetail,
  MyPageName,
  MyPageProfile,
  ManagedClub,
  Application,
  ApplicationResult,
  UploadUrlItem,
  ApiErrorData,
  ClubPayload,
} from "./types";
import { DEV_MOCK, MOCK_ME, MOCK_CLUB, MOCK_CLUBS } from "./dev_mock";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

const ACCESS_TOKEN_KEY = "smu_access_token";
const REFRESH_TOKEN_KEY = "smu_refresh_token";

// ===== 세션 만료 이벤트(전역) =====
const SESSION_EXPIRED_EVENT = "smu_session_expired_v1";

function emit_session_expired(detail: Record<string, unknown>): void {
  try {
    window.dispatchEvent(
      new CustomEvent(SESSION_EXPIRED_EVENT, { detail: detail || {} }),
    );
  } catch {
    // ignore
  }
}

export function on_session_expired(handler: (detail: Record<string, unknown>) => void): () => void {
  const h = (e: Event) => handler?.((e as CustomEvent<Record<string, unknown>>)?.detail || {});
  window.addEventListener(SESSION_EXPIRED_EVENT, h);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, h);
}

// ===== 토큰 유틸 =====
function get_access_token(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || null;
}

function get_refresh_token(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || null;
}

function set_tokens(access_token: string | null | undefined, refresh_token: string | null | undefined): void {
  const norm = (t: string | null | undefined): string | null => {
    if (!t) return null;
    const s = String(t).trim();
    return s.toLowerCase().startsWith("bearer ") ? s.slice(7).trim() : s;
  };

  const access = norm(access_token);
  const refresh = norm(refresh_token);

  if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clear_tokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function is_logged_in(): boolean {
  return !!get_access_token();
}

// ===== 내부 공통 =====
function resolve_url(path: string | URL): string | URL {
  if (typeof path === "string" && /^https?:\/\//.test(path)) return path;
  if (typeof path === "string") return `${API_BASE}${path}`;
  return path;
}

function make_init(init: RequestInit = {}, access_token: string | null): RequestInit {
  const merged_headers: Record<string, string> = {
    ...(init.headers as Record<string, string> || {}),
    ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
  };

  const has_body = init.body !== undefined && init.body !== null;

  return {
    method: "GET",
    ...init,
    credentials: "include",
    headers: has_body
      ? { "Content-Type": "application/json", ...merged_headers }
      : merged_headers,
  };
}

function is_reissue_call(path: string | URL): boolean {
  const p = String(path || "");
  return p.includes("/public/auth/reissue");
}

function is_expired_response(res: Response, data: ApiErrorData | null): boolean {
  if (data?.status === "FAIL" && data?.errorCode === "EXPIRED_TOKEN") return true;
  if (res?.status === 401 && data?.errorCode !== "LOGIN_FAILED") return true;
  return false;
}

let reissue_promise: Promise<{ access_token: string | null; refresh_token: string | null }> | null = null;

async function do_reissue(prev_access_token: string | null): Promise<{ access_token: string | null; refresh_token: string | null }> {
  const refresh_token = get_refresh_token();

  if (!refresh_token) {
    clear_tokens();
    emit_session_expired({ reason: "no_refresh_token" });
    throw Object.assign(
      new Error("세션이 만료되었습니다. 다시 로그인해 주세요."),
      { code: "EXPIRED_TOKEN" },
    );
  }

  const re_res = await fetch(resolve_url("/public/auth/reissue"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accessToken: prev_access_token,
      refreshToken: refresh_token,
    }),
  });

  const re_data: ApiWrapper<AuthTokenData> | null = await re_res.json().catch(() => null);

  if (!re_res.ok || re_data?.status === "FAIL") {
    clear_tokens();
    emit_session_expired({
      reason: "reissue_failed",
      status: re_res.status,
      raw: re_data,
    });
    throw Object.assign(
      new Error("세션이 만료되었습니다. 다시 로그인해 주세요."),
      { code: "EXPIRED_TOKEN" },
    );
  }

  const new_access = re_data?.data?.accessToken;
  const new_refresh = re_data?.data?.refreshToken;

  set_tokens(new_access, new_refresh);

  return {
    access_token: get_access_token(),
    refresh_token: get_refresh_token(),
  };
}

// ===== fetch 래퍼 =====
export async function apiFetch(path: string | URL, init: RequestInit = {}): Promise<Response> {
  let access_token = get_access_token();
  const doFetch = () => fetch(resolve_url(path), make_init(init, access_token));

  let res = await doFetch();

  let data: ApiErrorData | null = null;
  try {
    data = await res.clone().json();
  } catch {
    // ignore
  }

  if (is_reissue_call(path)) return res;

  if (data?.status === "FAIL" && data?.errorCode === "LOGIN_FAILED") return res;

  const expired = is_expired_response(res, data);
  if (!expired) return res;

  try {
    if (!reissue_promise) {
      reissue_promise = do_reissue(access_token).finally(() => {
        reissue_promise = null;
      });
    }

    const renewed = await reissue_promise;
    access_token = renewed.access_token;

    res = await fetch(resolve_url(path), make_init(init, access_token));

    let retry_data: ApiErrorData | null = null;
    try {
      retry_data = await res.clone().json();
    } catch {
      // ignore
    }

    if (is_expired_response(res, retry_data)) {
      clear_tokens();
      emit_session_expired({
        reason: "retry_still_expired",
        status: res.status,
        raw: retry_data,
      });
      throw Object.assign(
        new Error("세션이 만료되었습니다. 다시 로그인해 주세요."),
        { code: "EXPIRED_TOKEN" },
      );
    }

    return res;
  } catch (e) {
    const err = e as { code?: string };
    if (err?.code === "EXPIRED_TOKEN") {
      clear_tokens();
      emit_session_expired({ reason: "expired_token_throw" });
    }
    throw e;
  }
}

// ===== JSON 헬퍼 =====
export async function apiJson<T = unknown>(path: string | URL, init?: RequestInit): Promise<ApiWrapper<T>> {
  const res = await apiFetch(path, init);
  const data: ApiWrapper<T> | null = await res.json().catch(() => null);

  if (!res.ok || data?.status === "FAIL") {
    const msg = data?.message || "요청에 실패했습니다.";
    const code = data?.errorCode;
    const err = Object.assign(new Error(msg), {
      code: code || (res.status === 401 ? "UNAUTHORIZED" : "ERROR"),
      raw: data,
      status: res.status,
    });

    if (
      err.code === "EXPIRED_TOKEN" ||
      (res.status === 401 && err.code !== "LOGIN_FAILED")
    ) {
      clear_tokens();
      emit_session_expired({
        reason: "apiJson_error",
        status: res.status,
        raw: data,
      });
    }

    throw err;
  }
  return data!;
}

// ===== owner 전용 fetch =====
async function owner_fetch_json<T = unknown>(path: string | URL, init: RequestInit = {}): Promise<ApiWrapper<T>> {
  const res = await apiFetch(path, init);
  const data: ApiWrapper<T> | null = await res.json().catch(() => null);

  if (!res.ok || data?.status === "FAIL") {
    const err = Object.assign(new Error(data?.message || "요청에 실패했습니다."), {
      code: data?.errorCode || (res.status === 401 ? "UNAUTHORIZED" : "ERROR"),
      status: res.status,
      raw: data,
    });

    if (
      err.code === "EXPIRED_TOKEN" ||
      (res.status === 401 && err.code !== "LOGIN_FAILED")
    ) {
      clear_tokens();
      emit_session_expired({
        reason: "owner_fetch_json_error",
        status: res.status,
        raw: data,
      });
    }

    throw err;
  }

  return data!;
}

// ===== 인증 =====
export async function apiLogin({ studentId, password }: { studentId: string; password: string }): Promise<ApiWrapper<{ accessToken: string; refreshToken: string }>> {
  const data = await apiJson<{ accessToken: string; refreshToken: string }>("/public/auth/login", {
    method: "POST",
    body: JSON.stringify({ studentId, password }),
  });

  const accessToken = data?.data?.accessToken;
  const refreshToken = data?.data?.refreshToken;
  set_tokens(accessToken, refreshToken);

  return data;
}

export async function apiSignup({ studentId, password, phoneNumber }: { studentId: string; password: string; phoneNumber: string }): Promise<ApiWrapper<unknown>> {
  return apiJson("/public/auth/signup", {
    method: "POST",
    body: JSON.stringify({ studentId, password, phoneNumber }),
  });
}

export async function apiLogout(): Promise<ApiWrapper<unknown>> {
  const res = await apiJson("/auth/logout", { method: "POST" });
  clear_tokens();
  return res;
}

export async function fetch_auth_me(): Promise<AuthMe> {
  if (DEV_MOCK) return MOCK_ME;
  const res = await apiJson<AuthMe>("/auth/me", { method: "GET" });
  return res.data;
}

// ===== 공개 클럽 =====
export async function fetch_public_clubs(): Promise<ClubListItem[]> {
  if (DEV_MOCK) return MOCK_CLUBS;
  const res = await apiJson<ClubListItem[]>("/public/clubs", { method: "GET" });
  return res.data || [];
}

export async function fetch_public_club(club_id: string | number): Promise<Club> {
  if (DEV_MOCK) return { ...MOCK_CLUB, id: Number(club_id) || MOCK_CLUB.id };
  const res = await apiJson<Club>(`/public/clubs/${club_id}`, { method: "GET" });
  return res.data;
}

export async function fetch_public_application_form(club_id: string | number): Promise<Question[]> {
  const res = await apiJson<Question[]>(`/public/clubs/${club_id}/application-form`, { method: "GET" });
  return Array.isArray(res.data) ? res.data : [];
}

export async function create_application_session(club_id: string | number): Promise<unknown> {
  const res = await apiJson<unknown>(`/public/clubs/${club_id}/application/session`, { method: "POST" });
  return res.data;
}

export async function submit_public_application(club_id: string | number, payload: unknown): Promise<unknown> {
  const res = await apiJson<unknown>(`/public/clubs/${club_id}/applications`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

// ===== 멤버 =====
export async function fetch_mypage_name(): Promise<MyPageName> {
  const res = await apiJson<MyPageName>("/member/mypage/name", { method: "GET" });
  return res.data;
}

export async function fetch_mypage_profile(): Promise<MyPageProfile> {
  const res = await apiJson<MyPageProfile>("/member/mypage/update", { method: "GET" });
  return res.data;
}

export async function update_mypage_phone(newPhoneNumber: string): Promise<unknown> {
  const res = await apiJson<unknown>("/member/mypage/update/phone", {
    method: "PUT",
    body: JSON.stringify({ newPhoneNumber }),
  });
  return res.data;
}

export async function update_mypage_email(newEmail: string): Promise<unknown> {
  const res = await apiJson<unknown>("/member/mypage/update/email", {
    method: "PUT",
    body: JSON.stringify({ newEmail }),
  });
  return res.data;
}

export async function update_mypage_password(currentPassword: string, newPassword: string): Promise<unknown> {
  const res = await apiJson<unknown>("/member/mypage/update/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return res.data;
}

export async function fetch_my_applications(): Promise<Application[]> {
  const res = await apiJson<Application[]>("/member/mypage/applications", { method: "GET" });
  return res.data || [];
}

export async function fetch_application_result(club_id: string | number): Promise<ApplicationResult> {
  const res = await apiJson<ApplicationResult>(`/member/mypage/applications/${club_id}/result`, {
    method: "GET",
  });
  return res.data;
}

export async function delete_application(club_id: string | number): Promise<ApiWrapper<unknown>> {
  const res = await apiJson<unknown>(`/member/mypage/application/${club_id}/delete`, {
    method: "POST",
  });
  return res;
}

export async function fetch_application_for_update(club_id: string | number): Promise<unknown> {
  const res = await apiJson<unknown>(`/member/mypage/applications/${club_id}/update`, {
    method: "GET",
  });
  return res.data;
}

export async function update_application(club_id: string | number, payload: unknown): Promise<ApiWrapper<unknown>> {
  const res = await apiJson<unknown>(`/member/mypage/applications/${club_id}/update`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res;
}

// ===== OWNER =====
export async function fetch_owner_managed_clubs(): Promise<ManagedClub[]> {
  const res = await apiJson<ManagedClub[]>("/owner/club/managed-clubs", { method: "GET" });
  return res.data || [];
}

async function owner_issue_upload_urls(files: File[]): Promise<UploadUrlItem[]> {
  const payload_files = files.map((file) => ({
    fileName: file?.name || "file",
    contentType: file?.type || "application/octet-stream",
  }));

  const res = await apiJson<UploadUrlItem[]>("/owner/club/upload-urls", {
    method: "POST",
    body: JSON.stringify({ files: payload_files }),
  });

  return Array.isArray(res?.data) ? res.data : [];
}

async function owner_put_presigned_url(preSignedUrl: string, file: File): Promise<boolean> {
  const putRes = await fetch(preSignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file?.type || "application/octet-stream",
    },
    body: file,
  });

  if (!putRes.ok) {
    throw Object.assign(new Error("이미지 업로드에 실패했습니다."), { status: putRes.status });
  }
  return true;
}

export async function owner_upload_images(files: File[]): Promise<string[]> {
  if (DEV_MOCK) return files.map((_, i) => `mock_image_${i + 1}.jpg`);
  if (!Array.isArray(files) || files.length === 0) return [];

  const issued = await owner_issue_upload_urls(files);

  if (issued.length !== files.length) {
    throw new Error("업로드 URL 개수가 파일 개수와 다릅니다.");
  }

  const uploaded_names: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const issued_item = issued[i];

    if (!issued_item?.preSignedUrl || !issued_item?.fileName) {
      throw new Error(`업로드 URL 응답이 올바르지 않습니다 (index ${i})`);
    }

    await owner_put_presigned_url(issued_item.preSignedUrl, file);
    uploaded_names.push(issued_item.fileName);
  }

  return uploaded_names;
}

export async function owner_register_club(payload: ClubPayload): Promise<ApiWrapper<unknown>> {
  if (DEV_MOCK) return { status: "SUCCESS", data: { id: 1, ...payload } };
  return owner_fetch_json("/owner/clubs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload?.name ?? "",
      presidentName: payload?.presidentName ?? "",
      presidentPhone: payload?.presidentPhone ?? "",
      recruitDeadline: payload?.recruitDeadline ?? null,
      description: payload?.description ?? "",
      type: payload?.type ?? "CENTRAL",
      uploadedImageFileNames: payload?.uploadedImageFileNames ?? [],
    }),
  });
}

export async function fetch_owner_club_detail(club_id: string | number): Promise<Club | null> {
  if (DEV_MOCK) return { ...MOCK_CLUB, id: Number(club_id) || MOCK_CLUB.id };
  const res = await owner_fetch_json<Club>(`/owner/clubs/${club_id}`, {
    method: "GET",
  });
  return res.data || null;
}

export async function owner_update_club(club_id: string | number, payload: ClubPayload): Promise<Club | null> {
  if (DEV_MOCK) return { ...MOCK_CLUB, id: Number(club_id) || MOCK_CLUB.id, ...payload };
  const res = await owner_fetch_json<Club>(`/owner/clubs/${club_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: payload?.name ?? "",
      presidentName: payload?.presidentName ?? "",
      presidentPhone: payload?.presidentPhone ?? "",
      recruitDeadline: payload?.recruitDeadline ?? null,
      description: payload?.description ?? "",
      type: payload?.type ?? "CENTRAL",
      uploadedImageFileNames: payload?.uploadedImageFileNames ?? [],
    }),
  });
  return res.data || null;
}

export async function fetch_owner_applicants(club_id: string | number): Promise<Applicant[]> {
  const res = await owner_fetch_json<Applicant[]>(`/owner/club/${club_id}/applicants`, {
    method: "GET",
  });
  return res.data || [];
}

export async function fetch_owner_club_questions(club_id: string | number): Promise<Question[]> {
  const res = await apiJson<Question[]>(`/owner/clubs/${club_id}/questions`, {
    method: "GET",
  });
  return res.data || [];
}

export async function owner_update_club_questions(club_id: string | number, questions: unknown[]): Promise<ApiWrapper<unknown>> {
  return apiJson(`/owner/clubs/${club_id}/questions`, {
    method: "PUT",
    body: JSON.stringify(questions),
  });
}

export async function fetch_owner_applicant_detail(club_id: string | number, application_id: string | number): Promise<ApplicantDetail> {
  const res = await apiJson<ApplicantDetail>(
    `/owner/clubs/${club_id}/applications/${application_id}`,
    { method: "GET" },
  );
  return res.data;
}

export async function owner_update_applicant_status(
  club_id: string | number,
  application_id: string | number,
  new_status: string,
): Promise<ApiWrapper<unknown>> {
  return apiJson(
    `/owner/clubs/${club_id}/applications/status`,
    {
      method: "PUT",
      body: JSON.stringify([{ applicationId: Number(application_id), status: new_status }]),
    },
  );
}

export async function owner_download_applicants_excel(club_id: string | number): Promise<boolean> {
  const res = await apiFetch(`/owner/club/${club_id}/applicants/excel`, {
    method: "GET",
  });

  const content_type = (res.headers.get("content-type") || "").toLowerCase();

  if (content_type.includes("application/json")) {
    const json: ApiWrapper<string> | null = await res.json().catch(() => null);

    if (!res.ok || json?.status === "FAIL") {
      throw Object.assign(new Error(json?.message || "엑셀 다운로드에 실패했습니다."), {
        code: json?.errorCode || (res.status === 401 ? "UNAUTHORIZED" : "ERROR"),
        status: res.status,
        raw: json,
      });
    }

    const maybe_string = json?.data;

    if (typeof maybe_string === "string" && /^https?:\/\//.test(maybe_string)) {
      window.open(maybe_string, "_blank", "noopener,noreferrer");
      return true;
    }

    const blob = new Blob([maybe_string ?? ""], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applicants_${club_id}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  }

  if (!res.ok) {
    let msg = "엑셀 다운로드에 실패했습니다.";
    try {
      const txt = await res.text();
      if (txt) msg = txt;
    } catch {
      // ignore
    }
    throw Object.assign(new Error(msg), { status: res.status });
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  const cd = res.headers.get("content-disposition") || "";
  const match = /filename\*=utf-8''([^;]+)|filename="?([^"]+)"?/i.exec(cd) || [];
  const filename = decodeURIComponent(
    match[1] || match[2] || `applicants_${club_id}.xlsx`,
  );

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return true;
}

export async function owner_send_result_email(club_id: string | number): Promise<ApiWrapper<unknown>> {
  return apiJson(`/owner/club/email/${club_id}`, {
    method: "POST",
  });
}

// ===== MEMBER: 지원서 파일 =====
export async function member_issue_application_upload_url(file: File): Promise<unknown> {
  const res = await apiJson<unknown>("/member/clubs/application/upload-url", {
    method: "POST",
    body: JSON.stringify({
      originalFileName: file?.name || "file",
      contentType: file?.type || "application/octet-stream",
    }),
  });
  return res?.data || null;
}

export async function member_put_presigned_url(preSignedUrl: string, file: File): Promise<boolean> {
  const putRes = await fetch(preSignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file?.type || "application/octet-stream" },
    body: file,
  });

  if (!putRes.ok) {
    throw Object.assign(new Error("파일 업로드에 실패했습니다."), { status: putRes.status });
  }
  return true;
}

export async function member_issue_application_download_url(file_key: string): Promise<unknown> {
  const q = encodeURIComponent(String(file_key || ""));
  const candidates = [
    `/member/mypage/applications/file-url?fileKey=${q}`,
    `/member/mypage/applications/file-url?file_key=${q}`,
    `/member/applications/file-url?fileKey=${q}`,
    `/files/presigned-download?fileKey=${q}`,
    `/file/presigned-download?fileKey=${q}`,
  ];

  let last_err: unknown = null;

  for (const path of candidates) {
    try {
      const data = await apiJson(path, { method: "GET" });
      return data;
    } catch (e) {
      last_err = e;
    }
  }

  throw last_err || new Error("download url api not found");
}

export async function owner_issue_application_download_url(
  club_id: string | number,
  club_member_id: string | number,
  file_key: string,
): Promise<unknown> {
  const q = encodeURIComponent(String(file_key || ""));
  const candidates = [
    `/owner/club/${club_id}/applicants/${club_member_id}/file-url?fileKey=${q}`,
    `/owner/club/${club_id}/applicants/${club_member_id}/file-url?file_key=${q}`,
    `/owner/files/presigned-download?fileKey=${q}`,
    `/files/presigned-download?fileKey=${q}`,
  ];

  let last_err: unknown = null;

  for (const path of candidates) {
    try {
      const data = await apiJson(path, { method: "GET" });
      return data;
    } catch (e) {
      last_err = e;
    }
  }

  throw last_err || new Error("download url api not found");
}
