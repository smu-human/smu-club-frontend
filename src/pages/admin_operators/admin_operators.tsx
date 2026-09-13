// src/pages/admin_operators/admin_operators.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./admin_operators.css";
import { admin_create_operator, fetch_auth_me } from "../../lib/api";
import type { CreatedOperator } from "../../lib/types";

/** 서버(OperatorCreateRequest)와 같은 규칙. 왕복하기 전에 화면에서 먼저 걸러준다. */
const LOGIN_ID_PATTERN = /^[a-zA-Z0-9_.-]{3,50}$/;

/**
 * 운영자 계정 발급 — 개발자(role=ADMIN) 전용.
 *
 * 서버에 계정 목록 API가 없으므로 "이번에 만든 계정"만 화면에 쌓아 보여준다.
 * 새로고침하면 사라지며, 그 전에 아이디·비밀번호를 동아리장에게 전달해야 한다.
 */
export default function AdminOperators() {
  const navigate = useNavigate();

  const [is_admin, set_is_admin] = useState<boolean | null>(null);
  const [loading, set_loading] = useState(true);
  const [error_msg, set_error_msg] = useState("");

  const [login_id, set_login_id] = useState("");
  const [name, set_name] = useState("");
  const [submitting, set_submitting] = useState(false);
  const [created, set_created] = useState<CreatedOperator[]>([]);
  const [copied_id, set_copied_id] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      set_loading(true);
      try {
        const me = await fetch_auth_me();
        set_is_admin(me.role === "ADMIN");
      } catch (err) {
        set_error_msg((err as Error).message || "정보를 불러오지 못했습니다.");
      } finally {
        set_loading(false);
      }
    };
    load();
  }, []);

  const on_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    set_error_msg("");

    const id = login_id.trim();
    if (!LOGIN_ID_PATTERN.test(id)) {
      set_error_msg(
        "아이디는 3~50자의 영문·숫자와 _ . - 만 쓸 수 있습니다. (한글·공백 불가)",
      );
      return;
    }

    set_submitting(true);
    try {
      const operator = await admin_create_operator({
        loginId: id,
        name: name.trim() || undefined,
      });
      set_created((prev) => [operator, ...prev]);
      set_login_id("");
      set_name("");
    } catch (err) {
      set_error_msg((err as Error).message || "계정 생성에 실패했습니다.");
    } finally {
      set_submitting(false);
    }
  };

  const on_copy = async (operator: CreatedOperator) => {
    const text = `아이디: ${operator.loginId}\n비밀번호: ${operator.initialPassword}`;
    try {
      await navigator.clipboard.writeText(text);
      set_copied_id(operator.operatorId);
      window.setTimeout(() => set_copied_id(null), 1500);
    } catch {
      // 클립보드를 막아둔 브라우저에서는 화면의 값을 직접 복사하면 된다.
      set_error_msg("복사에 실패했습니다. 화면의 값을 직접 복사해 주세요.");
    }
  };

  return (
    <div className="ao-root">
      <header className="ao-header">
        <div className="ao-header-inner">
          <button
            type="button"
            className="ao-back"
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
          <h1 className="ao-header-title">계정 생성</h1>
        </div>
      </header>

      <main className="ao-main">
        {error_msg && <p className="ao-error">{error_msg}</p>}

        {loading ? (
          <p className="ao-hint">불러오는 중...</p>
        ) : !is_admin ? (
          <div className="ao-panel">
            <p className="ao-hint">
              계정 생성은 운영팀(개발자) 계정만 사용할 수 있습니다.
            </p>
            <button
              type="button"
              className="ao-btn"
              onClick={() => navigate("/admin/dashboard")}
            >
              대시보드로 돌아가기
            </button>
          </div>
        ) : (
          <div className="ao-grid">
            <section className="ao-panel">
              <h2 className="ao-panel-title">동아리장 계정 발급</h2>

              <form className="ao-form" onSubmit={on_submit}>
                <label className="ao-field">
                  <span className="ao-label">로그인 아이디</span>
                  <input
                    className="ao-input"
                    value={login_id}
                    maxLength={50}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="band_club"
                    onChange={(e) => set_login_id(e.target.value)}
                  />
                  <span className="ao-help">
                    3~50자, 영문·숫자와 _ . - 만. 동아리장이 직접 입력하므로
                    한글·공백은 쓸 수 없습니다.
                  </span>
                </label>

                <label className="ao-field">
                  <span className="ao-label">
                    이름 <em className="ao-optional">선택</em>
                  </span>
                  <input
                    className="ao-input"
                    value={name}
                    maxLength={100}
                    placeholder="밴드부"
                    onChange={(e) => set_name(e.target.value)}
                  />
                  <span className="ao-help">
                    비워두면 로그인 아이디가 이름이 됩니다. 나중에 바꾸는
                    화면이 없으니 가급적 입력해 주세요.
                  </span>
                </label>

                <button className="ao-btn ao-btn--primary" disabled={submitting}>
                  {submitting ? "생성 중..." : "계정 생성"}
                </button>
              </form>
            </section>

            <section className="ao-panel">
              <h2 className="ao-panel-title">방금 만든 계정</h2>

              {created.length === 0 ? (
                <p className="ao-hint">
                  아직 없습니다. 계정을 만들면 아이디와 초기 비밀번호가 여기에
                  표시됩니다.
                </p>
              ) : (
                <>
                  <p className="ao-warn">
                    새로고침하면 사라집니다. 닫기 전에 동아리장에게 전달하고,
                    <b> 첫 로그인 후 비밀번호를 꼭 바꾸라고 안내</b>해 주세요.
                  </p>
                  <ul className="ao-list">
                    {created.map((op) => (
                      <li className="ao-item" key={op.operatorId}>
                        <div className="ao-cred">
                          <div className="ao-cred-row">
                            <span className="ao-cred-key">아이디</span>
                            <code className="ao-cred-val">{op.loginId}</code>
                          </div>
                          <div className="ao-cred-row">
                            <span className="ao-cred-key">비밀번호</span>
                            <code className="ao-cred-val">
                              {op.initialPassword}
                            </code>
                          </div>
                          <div className="ao-cred-row">
                            <span className="ao-cred-key">이름</span>
                            <span className="ao-cred-name">{op.name}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="ao-btn ao-btn--small"
                          onClick={() => on_copy(op)}
                        >
                          {copied_id === op.operatorId ? "복사됨" : "복사"}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
