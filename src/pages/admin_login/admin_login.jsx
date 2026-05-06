// src/pages/admin_login/admin_login.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/globals.css";
import "./admin_login.css";
import { apiLogin, is_logged_in } from "../../lib/api";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [student_id, set_student_id] = useState("");
  const [password, set_password] = useState("");
  const [show_password, set_show_password] = useState(false);
  const [is_loading, set_is_loading] = useState(false);
  const [remember_me, set_remember_me] = useState(false);
  const [error_msg, set_error_msg] = useState("");

  useEffect(() => {
    if (is_logged_in()) navigate("/admin/dashboard", { replace: true });
  }, []);

  useEffect(() => {
    const saved_id = localStorage.getItem("smu_student_id");
    if (saved_id) {
      set_student_id(saved_id);
      set_remember_me(true);
    }
  }, []);

  const on_toggle_password = () => set_show_password((v) => !v);

  const on_submit = async (e) => {
    e.preventDefault();
    set_error_msg("");
    set_is_loading(true);

    try {
      await apiLogin({ studentId: student_id, password });

      if (remember_me) {
        localStorage.setItem("smu_student_id", student_id);
      } else {
        localStorage.removeItem("smu_student_id");
      }

      navigate("/admin/dashboard");
    } catch (err) {
      if (err.code === "UNAUTHORIZED") {
        set_error_msg("인증이 필요합니다.");
      } else if (err.code === "EXPIRED_TOKEN") {
        set_error_msg("세션이 만료되었습니다. 다시 로그인해주세요.");
      } else {
        set_error_msg(err.message || "로그인에 실패했습니다.");
      }
    } finally {
      set_is_loading(false);
    }
  };

  return (
    <div className="page-root">
      <div
        className="page-header sticky-header safe-area-top"
        style={{
          maxWidth: "none",
          margin: 0,
          paddingLeft: 20,
          paddingRight: 20,
        }}
      >
        <div className="page-header-content">
          <button
            type="button"
            className="back-btn"
            aria-label="뒤로가기"
            onClick={() => navigate("/")}
          >
            <svg
              className="icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1>관리자 로그인</h1>
        </div>
      </div>

      <main className="page-main">
        <div className="auth_page">
          <div className="hero-section">
            <div className="hero-content">
              <img
                src="/images/2.png"
                alt="스뮤 클럽 로고"
                className="hero-logo"
              />
              <p style={{ marginTop: "8px" }}>상명대학교 동아리 통합 플랫폼</p>
            </div>
          </div>

          <div className="form-container">
            <div className="card">
              <div className="card-header">
                <h3>아이디와 비밀번호를 입력해 주세요</h3>
                <p
                  aria-live="polite"
                  style={{ minHeight: 20, color: "#a82d2f" }}
                >
                  {error_msg || ""}
                </p>
              </div>

              <form
                className="login-form"
                autoComplete="off"
                onSubmit={on_submit}
              >
                <div className="form-group">
                  <label htmlFor="studentId">아이디</label>
                  <div className="input-container">
                    <svg
                      className="input-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      type="text"
                      id="studentId"
                      placeholder="학번을 입력해주세요"
                      required
                      inputMode="numeric"
                      value={student_id}
                      onChange={(e) => set_student_id(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password">비밀번호</label>
                  <div className="input-container">
                    <svg
                      className="input-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <circle cx="12" cy="16" r="1" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      type={show_password ? "text" : "password"}
                      id="password"
                      placeholder="비밀번호를 입력하세요"
                      required
                      value={password}
                      onChange={(e) => set_password(e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      aria-label="비밀번호 보기 전환"
                      onClick={on_toggle_password}
                    >
                      <svg
                        className="icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="form-options">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={remember_me}
                      onChange={(e) => set_remember_me(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    로그인 상태 유지
                  </label>
                  <a
                    href="https://open.kakao.com/o/gYlJJWii"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="forgot-password"
                  >
                    비밀번호를 잊어버리셨나요?
                  </a>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-large"
                  disabled={is_loading}
                >
                  <span>{is_loading ? "로그인 중..." : "로그인"}</span>
                  <div
                    className="spinner"
                    aria-hidden="true"
                    style={{ display: is_loading ? "inline-block" : "none" }}
                  />
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-large"
                  onClick={() => navigate("/admin/dashboard")}
                  style={{ marginTop: 12 }}
                >
                  다음 (임시)
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <div className="page-footer">
        <p>© 2025 smu-club. 상명대학교 동아리 통합 플랫폼</p>
        <p>
          <a
            href="https://github.com/smu-human/smu-club"
            target="_blank"
            rel="noopener noreferrer"
          >
            Github
          </a>
        </p>
      </div>
    </div>
  );
}
