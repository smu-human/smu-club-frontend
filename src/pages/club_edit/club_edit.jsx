// src/pages/club_edit/club_edit.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/globals.css";
import "./club_edit.css";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import { owner_register_club } from "../../lib/api";

export default function ClubEdit() {
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const scroll_ref = useRef(null);

  useEffect(() => {
    const scroll_to_top = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      if (scroll_ref.current) {
        scroll_ref.current.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    };

    scroll_to_top();
    requestAnimationFrame(() => {
      scroll_to_top();
      requestAnimationFrame(scroll_to_top);
    });

    const t = setTimeout(scroll_to_top, 0);
    const t2 = setTimeout(scroll_to_top, 80);

    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  const today_str = new Date().toISOString().slice(0, 10);

  const [club_name, set_club_name] = useState("");
  const [president_name, set_president_name] = useState("");
  const [president_phone, set_president_phone] = useState("");
  const [recruit_deadline, set_recruit_deadline] = useState("");
  const [is_saving, set_is_saving] = useState(false);

  // ✅ 실시간 “실제 렌더” 프리뷰
  const [preview_html, set_preview_html] = useState("");
  const [show_live_preview, set_show_live_preview] = useState(true);

  // ✅ 풀스크린(모달 느낌)
  const [is_editor_fullscreen, set_is_editor_fullscreen] = useState(false);

  const preview_timer_ref = useRef(null);
  const sync_preview_from_editor = () => {
    if (preview_timer_ref.current) clearTimeout(preview_timer_ref.current);

    preview_timer_ref.current = setTimeout(() => {
      const html = editorRef.current?.getInstance().getHTML() || "";
      set_preview_html(html);
    }, 200);
  };

  useEffect(() => {
    // 최초 1회 프리뷰 동기화
    const t = setTimeout(() => {
      const html = editorRef.current?.getInstance().getHTML() || "";
      set_preview_html(html);
    }, 0);

    return () => {
      clearTimeout(t);
      if (preview_timer_ref.current) clearTimeout(preview_timer_ref.current);
    };
  }, []);

  // ESC로 풀스크린 닫기
  useEffect(() => {
    const on_key = (e) => {
      if (e.key === "Escape") set_is_editor_fullscreen(false);
    };
    window.addEventListener("keydown", on_key);
    return () => window.removeEventListener("keydown", on_key);
  }, []);

  const on_save = async () => {
    if (is_saving) return;
    set_is_saving(true);

    try {
      if (!recruit_deadline) {
        alert("모집 마감일을 설정해주세요.");
        return;
      }

      const intro_html = editorRef.current?.getInstance().getHTML() || "";

      await owner_register_club({
        name: club_name,
        presidentName: president_name,
        presidentPhone: president_phone,
        recruitDeadline: recruit_deadline || null,
        description: intro_html,
        type: "CENTRAL",
      });

      alert("저장 완료");
      navigate("/mypage");
    } catch (e) {
      alert(e?.message || "저장 실패");
    } finally {
      set_is_saving(false);
    }
  };

  return (
    <div className="page-root" ref={scroll_ref}>
      <div className="page-header sticky-header safe-area-top">
        <div className="container">
          <div className="page-header-content">
            <button
              type="button"
              className="back-btn"
              aria-label="뒤로가기"
              onClick={() => navigate("/mypage")}
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
            <h1>동아리 등록</h1>
          </div>
        </div>
      </div>

      <main className="page-main club_edit_main">
        <section className="club_section">
          <h2 className="club_title">기본 정보</h2>
          <div className="club_card">
            <label className="field_label">동아리명</label>
            <input
              className="field_input"
              type="text"
              value={club_name}
              onChange={(e) => set_club_name(e.target.value)}
            />

            <label className="field_label">회장 이름</label>
            <input
              className="field_input"
              type="text"
              value={president_name}
              onChange={(e) => set_president_name(e.target.value)}
            />

            <label className="field_label">회장 연락처 (- 없이 숫자만 입력)</label>
            <input
              className="field_input"
              type="tel"
              value={president_phone}
              onChange={(e) => set_president_phone(e.target.value)}
            />

            <label className="field_label">모집 마감일</label>
            <input
              className="field_input"
              type="date"
              value={recruit_deadline}
              min={today_str}
              onChange={(e) => set_recruit_deadline(e.target.value)}
            />
          </div>
        </section>

        <section className="club_section">
          <h2 className="club_title">동아리 소개</h2>

          <div
            className={[
              "club_card",
              "editor_shell",
              is_editor_fullscreen ? "editor_fullscreen" : "",
            ].join(" ")}
          >
            <div className="editor_topbar">
              <div className="editor_topbar_left">
                <button
                  type="button"
                  className="mini_btn"
                  onClick={() => set_show_live_preview((v) => !v)}
                >
                  {show_live_preview ? "프리뷰 숨기기" : "프리뷰 보기"}
                </button>
              </div>

              <div className="editor_topbar_right">
                <button
                  type="button"
                  className="mini_btn"
                  onClick={() => {
                    set_is_editor_fullscreen((v) => !v);
                    // 풀스크린 전환 직후 프리뷰 동기화
                    setTimeout(() => {
                      const html =
                        editorRef.current?.getInstance().getHTML() || "";
                      set_preview_html(html);
                    }, 0);
                  }}
                >
                  {is_editor_fullscreen ? "전체화면 닫기 (ESC)" : "전체화면"}
                </button>
              </div>
            </div>

            <div
              className={[
                "editor_grid",
                show_live_preview ? "with_preview" : "no_preview",
              ].join(" ")}
            >
              <div className="editor_col">
                <Editor
                  ref={editorRef}
                  height={is_editor_fullscreen ? "74vh" : "520px"}
                  initialEditType="wysiwyg"
                  previewStyle="tab"
                  usageStatistics={false}
                  placeholder="동아리 소개와 활동 내용을 자유롭게 작성하세요."
                  onChange={sync_preview_from_editor}
                />
              </div>
              {show_live_preview && (
                <div className="preview_col">
                  <div className="preview_title">실제 화면 미리보기</div>
                  <div
                    className="club_description preview_box"
                    dangerouslySetInnerHTML={{
                      __html: preview_html || "<p></p>",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <button
          className="primary_btn club_save_btn"
          onClick={on_save}
          disabled={is_saving}
        >
          {is_saving ? "저장 중..." : "저장하기"}
        </button>
      </main>

      <div className="page-footer">
        <p>© 2025 smu-club. 상명대학교 동아리 플랫폼</p>
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
