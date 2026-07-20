// src/pages/admin_mypage/admin_mypage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/globals.css";
import "../admin_login/admin_login.css";
import { fetch_auth_me, update_mypage_password } from "../../lib/api";

export default function AdminMyPage() {
  const navigate = useNavigate();

  const [current_pw, set_current_pw] = useState("");
  const [new_pw, set_new_pw] = useState("");
  const [confirm_pw, set_confirm_pw] = useState("");
  const [show_current, set_show_current] = useState(false);
  const [show_new, set_show_new] = useState(false);
  const [show_confirm, set_show_confirm] = useState(false);
  const [is_loading, set_is_loading] = useState(false);
  const [error_msg, set_error_msg] = useState("");

  useEffect(() => {
    fetch_auth_me().catch(() => {});
  }, []);

  const on_submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    set_error_msg("");

    if (new_pw !== confirm_pw) {
      set_error_msg("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    set_is_loading(true);
    try {
      await update_mypage_password(current_pw, new_pw);
      alert("비밀번호가 변경되었습니다.");
      set_current_pw("");
      set_new_pw("");
      set_confirm_pw("");
    } catch (err: unknown) {
      const e = err as Error;
      set_error_msg(e.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      set_is_loading(false);
    }
  };

  const EyeIcon = () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const LockIcon = () => (
    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <circle cx="12" cy="16" r="1" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );

  return (
    <div className="page-root">
      <div
        className="page-header sticky-header safe-area-top"
        style={{ maxWidth: "none", margin: 0, paddingLeft: 20, paddingRight: 20 }}
      >
        <div className="page-header-content">
          <button
            type="button"
            className="back-btn"
            aria-label="뒤로가기"
            onClick={() => navigate("/admin/dashboard")}
          >
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1>마이페이지</h1>
        </div>
      </div>

      <main className="page-main">
        <div className="auth_page">
          <div className="hero-section">
            <div className="hero-content">
              <img src="/images/2.png" alt="스뮤 클럽 로고" className="hero-logo" />
              <p style={{ marginTop: "8px" }}>상명대학교 동아리 통합 플랫폼</p>
            </div>
          </div>

          <div className="form-container">
            <div className="card">
              <div className="card-header">
                <h3>비밀번호를 변경해 주세요</h3>
                <p aria-live="polite" style={{ minHeight: 20, color: "#a82d2f" }}>
                  {error_msg || ""}
                </p>
              </div>

              <form className="login-form" autoComplete="off" onSubmit={on_submit}>
                <div className="form-group">
                  <label htmlFor="currentPw">현재 비밀번호</label>
                  <div className="input-container">
                    <LockIcon />
                    <input
                      type={show_current ? "text" : "password"}
                      id="currentPw"
                      placeholder="현재 비밀번호를 입력하세요"
                      required
                      value={current_pw}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => set_current_pw(e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      aria-label="비밀번호 보기 전환"
                      onClick={() => set_show_current((v) => !v)}
                    >
                      <EyeIcon />
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="newPw">새 비밀번호</label>
                  <div className="input-container">
                    <LockIcon />
                    <input
                      type={show_new ? "text" : "password"}
                      id="newPw"
                      placeholder="새 비밀번호를 입력하세요"
                      required
                      value={new_pw}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => set_new_pw(e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      aria-label="비밀번호 보기 전환"
                      onClick={() => set_show_new((v) => !v)}
                    >
                      <EyeIcon />
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPw">새 비밀번호 확인</label>
                  <div className="input-container">
                    <LockIcon />
                    <input
                      type={show_confirm ? "text" : "password"}
                      id="confirmPw"
                      placeholder="새 비밀번호를 다시 입력하세요"
                      required
                      value={confirm_pw}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => set_confirm_pw(e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      aria-label="비밀번호 보기 전환"
                      onClick={() => set_show_confirm((v) => !v)}
                    >
                      <EyeIcon />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-large"
                  disabled={is_loading}
                >
                  <span>{is_loading ? "변경 중..." : "비밀번호 변경"}</span>
                  <div
                    className="spinner"
                    aria-hidden="true"
                    style={{ display: is_loading ? "inline-block" : "none" }}
                  />
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <div className="page-footer">
        <p>© 2025 smu-club. 상명대학교 동아리 통합 플랫폼</p>
        <p>
          <a href="https://github.com/smu-human/smu-club" target="_blank" rel="noopener noreferrer">
            Github
          </a>
        </p>
      </div>
    </div>
  );
}
