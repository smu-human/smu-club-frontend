// src/pages/admin_notices/admin_notices.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./admin_notices.css";
import {
  admin_create_notice,
  admin_delete_notice,
  admin_fetch_notices,
  admin_upload_notice_image,
  fetch_auth_me,
} from "../../lib/api";
import type { Notice } from "../../lib/types";

const TITLE_MAX = 100;
const BODY_MAX = 2000;

function fmt_date(v: string | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd}`;
}

/**
 * 공지 관리 — 개발자(role=ADMIN) 전용.
 *
 * 수정 기능은 두지 않는다. 오타가 나면 삭제하고 다시 올린다(서버에도 수정 API가 없다).
 * 화면에서 role을 확인하지만 그건 안내를 위한 것이고, 실제 차단은 서버가 403으로 한다.
 */
export default function AdminNotices() {
  const navigate = useNavigate();
  const file_input_ref = useRef<HTMLInputElement>(null);

  const [is_admin, set_is_admin] = useState<boolean | null>(null);
  const [notices, set_notices] = useState<Notice[]>([]);
  const [loading, set_loading] = useState(true);
  const [error_msg, set_error_msg] = useState("");

  const [title, set_title] = useState("");
  const [body, set_body] = useState("");
  const [image_file, set_image_file] = useState<File | null>(null);
  const [preview_url, set_preview_url] = useState("");
  const [submitting, set_submitting] = useState(false);
  const [deleting_id, set_deleting_id] = useState<number | null>(null);

  const load_notices = async () => {
    const data = await admin_fetch_notices();
    set_notices(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    const load = async () => {
      set_loading(true);
      set_error_msg("");
      try {
        const me = await fetch_auth_me();
        if (me.role !== "ADMIN") {
          set_is_admin(false);
          return;
        }
        set_is_admin(true);
        await load_notices();
      } catch (err) {
        set_error_msg((err as Error).message || "공지를 불러오지 못했습니다.");
      } finally {
        set_loading(false);
      }
    };
    load();
  }, []);

  // 미리보기 URL은 objectURL 이라 다 쓰면 직접 풀어줘야 한다.
  useEffect(() => {
    if (!image_file) {
      set_preview_url("");
      return;
    }
    const url = URL.createObjectURL(image_file);
    set_preview_url(url);
    return () => URL.revokeObjectURL(url);
  }, [image_file]);

  const reset_form = () => {
    set_title("");
    set_body("");
    set_image_file(null);
    if (file_input_ref.current) file_input_ref.current.value = "";
  };

  const on_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    set_error_msg("");

    if (!title.trim()) return set_error_msg("제목을 입력해 주세요.");
    if (!image_file) return set_error_msg("배너 이미지를 선택해 주세요.");
    if (!body.trim()) return set_error_msg("본문을 입력해 주세요.");

    set_submitting(true);
    try {
      // 업로드 → 반환된 키(notices/...)를 등록 요청에 실어 보낸다.
      const image_file_name = await admin_upload_notice_image(image_file);
      await admin_create_notice({
        title: title.trim(),
        body: body.trim(),
        imageFileName: image_file_name,
      });
      reset_form();
      await load_notices();
    } catch (err) {
      set_error_msg((err as Error).message || "공지 등록에 실패했습니다.");
    } finally {
      set_submitting(false);
    }
  };

  const on_delete = async (notice: Notice) => {
    if (!window.confirm(`"${notice.title}" 공지를 삭제할까요?`)) return;

    set_error_msg("");
    set_deleting_id(notice.id);
    try {
      await admin_delete_notice(notice.id);
      await load_notices();
    } catch (err) {
      set_error_msg((err as Error).message || "공지 삭제에 실패했습니다.");
    } finally {
      set_deleting_id(null);
    }
  };

  return (
    <div className="an-root">
      <header className="an-header">
        <div className="an-header-inner">
          <button
            type="button"
            className="an-back"
            aria-label="뒤로가기"
            onClick={() => navigate("/admin/dashboard")}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="an-header-title">공지 관리</h1>
        </div>
      </header>

      <main className="an-main">
        {error_msg && <p className="an-error">{error_msg}</p>}

        {loading ? (
          <p className="an-hint">불러오는 중...</p>
        ) : is_admin === false ? (
          <div className="an-panel">
            <p className="an-hint">
              공지 관리는 운영팀(개발자) 계정만 사용할 수 있습니다.
            </p>
            <button
              type="button"
              className="an-btn"
              onClick={() => navigate("/admin/dashboard")}
            >
              대시보드로 돌아가기
            </button>
          </div>
        ) : (
          <div className="an-grid">
            {/* 등록 */}
            <section className="an-panel">
              <h2 className="an-panel-title">공지 등록</h2>

              <form className="an-form" onSubmit={on_submit}>
                <label className="an-field">
                  <span className="an-label">
                    제목
                    <em className="an-count">
                      {title.length}/{TITLE_MAX}
                    </em>
                  </span>
                  <input
                    className="an-input"
                    value={title}
                    maxLength={TITLE_MAX}
                    placeholder="2학기 동아리 모집 일정 안내"
                    onChange={(e) => set_title(e.target.value)}
                  />
                </label>

                <div className="an-field">
                  <span className="an-label">배너 이미지 (5:1, 권장 2000×400)</span>
                  <input
                    className="an-file"
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    ref={file_input_ref}
                    onChange={(e) => set_image_file(e.target.files?.[0] ?? null)}
                  />
                  {preview_url ? (
                    <div className="an-preview">
                      <img src={preview_url} alt="배너 미리보기" />
                      <p className="an-preview-hint">
                        홈에서는 이 비율 그대로 보입니다. 잘린 부분이 있으면
                        이미지를 5:1로 다시 만들어 주세요.
                      </p>
                    </div>
                  ) : (
                    <div className="an-preview an-preview--empty">
                      <span>미리보기</span>
                    </div>
                  )}
                </div>

                <label className="an-field">
                  <span className="an-label">
                    본문
                    <em className="an-count">
                      {body.length}/{BODY_MAX}
                    </em>
                  </span>
                  <textarea
                    className="an-textarea"
                    value={body}
                    maxLength={BODY_MAX}
                    rows={8}
                    placeholder={
                      "배너를 눌렀을 때 보여줄 안내 글입니다.\n줄바꿈은 그대로 표시됩니다."
                    }
                    onChange={(e) => set_body(e.target.value)}
                  />
                </label>

                <button className="an-btn an-btn--primary" disabled={submitting}>
                  {submitting ? "등록 중..." : "등록"}
                </button>
                <p className="an-hint an-hint--small">
                  등록한 공지는 수정할 수 없습니다. 내용을 바꾸려면 삭제 후 다시
                  등록해 주세요.
                </p>
              </form>
            </section>

            {/* 목록 */}
            <section className="an-panel">
              <h2 className="an-panel-title">
                등록된 공지 <em className="an-count">{notices.length}개</em>
              </h2>

              {notices.length === 0 ? (
                <p className="an-hint">등록된 공지가 없습니다.</p>
              ) : (
                <ul className="an-list">
                  {notices.map((n) => (
                    <li className="an-item" key={n.id}>
                      <img
                        className="an-thumb"
                        src={n.imageUrl}
                        alt={`${n.title} 배너`}
                      />
                      <div className="an-item-text">
                        <span className="an-item-title">{n.title}</span>
                        <span className="an-item-date">
                          {fmt_date(n.createdAt)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="an-btn an-btn--danger"
                        disabled={deleting_id === n.id}
                        onClick={() => on_delete(n)}
                      >
                        {deleting_id === n.id ? "삭제 중..." : "삭제"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
