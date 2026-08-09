// src/pages/club_register/club_register.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/globals.css";
import "./club_register.css";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";
import { owner_register_club, owner_upload_images } from "../../lib/api";

export default function ClubRegister() {
  const navigate = useNavigate();
  const editorRef = useRef<{ getInstance(): { getHTML(): string } } | null>(null);
  const scroll_ref = useRef<HTMLDivElement | null>(null);

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
  const [club_one_line, set_club_one_line] = useState("");
  const [leader_name, set_leader_name] = useState("");
  const [phone, set_phone] = useState("");
  const [deadline, set_deadline] = useState("");

  // 이미지: File[] + 썸네일 URL[]
  const [images, set_images] = useState<File[]>([]);
  const [thumb_urls, set_thumb_urls] = useState<string[]>([]);
  const drag_idx = useRef<number | null>(null);
  const [over_idx, set_over_idx] = useState<number | null>(null);

  const [is_saving, set_is_saving] = useState(false);

  // 에디터 프리뷰
  const [preview_html, set_preview_html] = useState("");
  const [show_live_preview, set_show_live_preview] = useState(true);
  const [is_editor_fullscreen, set_is_editor_fullscreen] = useState(false);

  const preview_timer_ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sync_preview_from_editor = () => {
    if (preview_timer_ref.current) clearTimeout(preview_timer_ref.current);
    preview_timer_ref.current = setTimeout(() => {
      const html = editorRef.current?.getInstance().getHTML() || "";
      set_preview_html(html);
    }, 200);
  };

  // 초기 프리뷰 동기화
  useEffect(() => {
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
    const on_key = (e: KeyboardEvent) => {
      if (e.key === "Escape") set_is_editor_fullscreen(false);
    };
    window.addEventListener("keydown", on_key);
    return () => window.removeEventListener("keydown", on_key);
  }, []);

  // 썸네일 URL 정리
  useEffect(() => {
    return () => {
      thumb_urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [thumb_urls]);

  const on_pick_images = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const total = images.length + files.length;

    let picked = files;
    if (total > 5) {
      const remaining = Math.max(0, 5 - images.length);
      alert(`이미지는 최대 5장까지만 등록할 수 있습니다. ${remaining}장만 추가됩니다.`);
      picked = files.slice(0, remaining);
    }

    const new_urls = picked.map((f) => URL.createObjectURL(f));
    set_images((prev) => [...prev, ...picked]);
    set_thumb_urls((prev) => [...prev, ...new_urls]);
    e.target.value = "";
  };

  const remove_image = (idx: number) => {
    URL.revokeObjectURL(thumb_urls[idx]);
    set_images((prev) => prev.filter((_, i) => i !== idx));
    set_thumb_urls((prev) => prev.filter((_, i) => i !== idx));
  };

  const reorder_images = (from: number, to: number) => {
    if (from === to) return;
    const reorder = <T,>(arr: T[]): T[] => {
      const next = [...arr];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    };
    set_images((prev) => reorder(prev));
    set_thumb_urls((prev) => reorder(prev));
  };

  const on_save = async () => {
    if (is_saving) return;
    if (!deadline) {
      alert("모집 마감일을 설정해주세요.");
      return;
    }
    set_is_saving(true);
    try {
      let uploadedImageFileNames: string[] = [];
      if (images.length > 0) {
        uploadedImageFileNames = await owner_upload_images(images);
      }

      const description_html = editorRef.current?.getInstance().getHTML() || "";

      await owner_register_club({
        name: club_name,
        title: club_one_line,
        presidentName: leader_name,
        contact: phone,
        recruitDeadline: deadline || null,
        description: description_html,
        type: "CENTRAL",
        uploadedImageFileNames,
      });

      alert("동아리가 등록되었습니다.");
      navigate("/admin/dashboard");
    } catch (err) {
      alert((err as Error & { code?: string })?.message || "등록에 실패했습니다.");
    } finally {
      set_is_saving(false);
    }
  };

  return (
    <div className="page-root cr_page" ref={scroll_ref}>
      <div className="page-header sticky-header safe-area-top">
        <div className="container">
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
            <h1>동아리 등록</h1>
          </div>
        </div>
      </div>

      <main className="page-main cr_main">
        {/* 갤러리 이미지 + 기본 정보 (1행 2열) */}
        <div className="cr_top_row">
        <section className="cr_section">
          <h2 className="cr_title">갤러리 이미지</h2>
          <div className="cr_card">
            <p className="cr_sub_text">
              동아리 페이지 상단 갤러리 이미지를 등록하세요. (JPG/PNG, 최대 5장)
              <br />
              <span className="cr_hint_drag">드래그로 순서 변경</span>
            </p>

            {thumb_urls.length > 0 && (
              <div className="cr_img_list">
                {thumb_urls.map((url, idx) => (
                  <div
                    key={url}
                    className={`cr_img_row${over_idx === idx ? " cr_img_row--over" : ""}${drag_idx.current === idx ? " cr_img_row--dragging" : ""}`}
                    draggable
                    onDragStart={() => { drag_idx.current = idx; set_over_idx(null); }}
                    onDragEnd={() => { drag_idx.current = null; set_over_idx(null); }}
                    onDragOver={(e) => { e.preventDefault(); set_over_idx(idx); }}
                    onDragLeave={() => set_over_idx(null)}
                    onDrop={() => {
                      if (drag_idx.current !== null) {
                        reorder_images(drag_idx.current, idx);
                      }
                      drag_idx.current = null;
                      set_over_idx(null);
                    }}
                  >
                    <img src={url} alt={`갤러리 ${idx + 1}`} className="cr_img_thumb" />
                    <span className="cr_img_label">이미지 {idx + 1}</span>
                    <button
                      type="button"
                      className="cr_img_remove"
                      onClick={() => remove_image(idx)}
                      aria-label="이미지 삭제"
                    >×</button>
                    <div className="cr_img_handle" aria-label="순서 변경">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="4" y1="6" x2="20" y2="6" />
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <line x1="4" y1="18" x2="20" y2="18" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="cr_gallery_center">
              <label
                className="cr_outline_btn"
                htmlFor="clubGallery"
                style={{ opacity: images.length >= 5 ? 0.5 : 1, pointerEvents: images.length >= 5 ? "none" : "auto" }}
              >
                이미지 추가
              </label>
              <input
                id="clubGallery"
                type="file"
                accept="image/png, image/jpeg"
                multiple
                onChange={on_pick_images}
                disabled={images.length >= 5}
                style={{ display: "none" }}
              />
              <p className="cr_hint_text">{`선택: ${images.length}개 / 최대 5개`}</p>
            </div>
          </div>
        </section>

        {/* 기본 정보 */}
        <section className="cr_section">
          <h2 className="cr_title">기본 정보</h2>
          <div className="cr_card">
            <label className="cr_field_label" htmlFor="clubName">동아리명</label>
            <input
              id="clubName"
              className="cr_field_input"
              type="text"
              value={club_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set_club_name(e.target.value)}
            />

            <label className="cr_field_label" htmlFor="clubOneLine">동아리 한줄 소개</label>
            <input
              id="clubOneLine"
              className="cr_field_input"
              type="text"
              value={club_one_line}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set_club_one_line(e.target.value)}
            />

            <label className="cr_field_label" htmlFor="leaderName">회장</label>
            <input
              id="leaderName"
              className="cr_field_input"
              type="text"
              value={leader_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set_leader_name(e.target.value)}
            />

            <label className="cr_field_label" htmlFor="phone">인스타그램 계정</label>
            <input
              id="phone"
              className="cr_field_input"
              type="text"
              placeholder="@계정명"
              value={phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set_phone(e.target.value)}
            />

            <label className="cr_field_label" htmlFor="deadline">모집 마감일</label>
            <input
              id="deadline"
              className="cr_field_input"
              type="date"
              value={deadline}
              min={today_str}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => set_deadline(e.target.value)}
            />
          </div>
        </section>
        </div>

        {/* 동아리 소개 */}
        <section className="cr_section">
          <h2 className="cr_title">동아리 소개</h2>
          <div
            className={[
              "cr_card",
              "cr_editor_shell",
              is_editor_fullscreen ? "cr_editor_fullscreen" : "",
            ].join(" ")}
          >
            <div className="cr_editor_topbar">
              <button
                type="button"
                className="cr_mini_btn"
                onClick={() => set_show_live_preview((v) => !v)}
              >
                {show_live_preview ? "프리뷰 숨기기" : "프리뷰 보기"}
              </button>
              <button
                type="button"
                className="cr_mini_btn"
                onClick={() => {
                  set_is_editor_fullscreen((v) => !v);
                  setTimeout(() => {
                    const html = editorRef.current?.getInstance().getHTML() || "";
                    set_preview_html(html);
                  }, 0);
                }}
              >
                {is_editor_fullscreen ? "전체화면 닫기 (ESC)" : "전체화면"}
              </button>
            </div>

            <div className={["cr_editor_grid", show_live_preview ? "with_preview" : "no_preview"].join(" ")}>
              <div className="cr_editor_col">
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
                <div className="cr_preview_col">
                  <div className="cr_preview_title">실제 화면 미리보기 (390px)</div>
                  <div className="cr_phone_wrapper">
                    <div className="cr_phone_frame">
                      <div className="cr_phone_notch" />
                      <div className="cr_phone_screen">
                        <div
                          className="cr_preview_content toastui-editor-contents"
                          dangerouslySetInnerHTML={{ __html: preview_html || "<p></p>" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <button
          className="cr_primary_btn cr_save_btn"
          onClick={on_save}
          disabled={is_saving}
        >
          {is_saving ? "저장 중..." : "저장하기"}
        </button>
      </main>

      <div className="page-footer">
        <p>© 2025 smu-club. 상명대학교 동아리 플랫폼</p>
        <p>
          <a href="https://github.com/smu-human/smu-club" target="_blank" rel="noopener noreferrer">
            Github
          </a>
        </p>
      </div>
    </div>
  );
}
