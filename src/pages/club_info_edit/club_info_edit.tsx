// src/pages/club_info_edit/club_info_edit.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/globals.css";
import "./club_info_edit.css";
import { Editor } from "@toast-ui/react-editor";
import "@toast-ui/editor/dist/toastui-editor.css";

interface DisplayImage {
  url: string;
  key?: string;
}

const MOCK_CLUB = {
  name: "예시 동아리",
  title: "동아리를 소개하는 한 줄 문구",
  president: "홍길동",
  contact: "010-1234-5678",
  recruitingEnd: "",
  description: "",
  images: [] as DisplayImage[],
};

function to_display_name(v: unknown): string {
  const s = String(v || "");
  try {
    const decoded = decodeURIComponent(s);
    return decoded.split("/").pop() || decoded;
  } catch {
    return s.split("/").pop() || s;
  }
}

export default function ClubInfoEdit() {
  const navigate = useNavigate();
  const { clubId } = useParams<{ clubId: string }>();
  const editorRef = useRef<{ getInstance(): { getHTML(): string } } | null>(null);

  const today_str = new Date().toISOString().slice(0, 10);

  const [club_name, set_club_name] = useState(MOCK_CLUB.name);
  const [one_line, set_one_line] = useState(MOCK_CLUB.title);
  const [president, set_president] = useState(MOCK_CLUB.president);
  const [contact, set_contact] = useState(MOCK_CLUB.contact);
  const [deadline, set_deadline] = useState(MOCK_CLUB.recruitingEnd);

  const [display_images, set_display_images] = useState<DisplayImage[]>([]); // { url, key } — 기존 이미지
  const [new_images, set_new_images] = useState<File[]>([]); // File[] — 새로 추가

  const [active_idx, set_active_idx] = useState(0);
  const carousel_ref = useRef<HTMLDivElement | null>(null);

  const [editor_html] = useState(MOCK_CLUB.description);
  const [preview_html, set_preview_html] = useState(MOCK_CLUB.description);
  const [show_preview, set_show_preview] = useState(true);
  const [is_fullscreen, set_is_fullscreen] = useState(false);

  const preview_timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sync_preview = () => {
    if (preview_timer.current) clearTimeout(preview_timer.current);
    preview_timer.current = setTimeout(() => {
      const html = editorRef.current?.getInstance()?.getHTML() || "";
      set_preview_html(html);
    }, 200);
  };

  useEffect(() => {
    const on_key = (e: KeyboardEvent) => {
      if (e.key === "Escape") set_is_fullscreen(false);
    };
    window.addEventListener("keydown", on_key);
    return () => {
      window.removeEventListener("keydown", on_key);
      if (preview_timer.current) clearTimeout(preview_timer.current);
    };
  }, []);

  // 캐러셀 전체 이미지 목록 (기존 display + 새 파일 미리보기 URL)
  const all_image_urls = [
    ...display_images.map((it) => it.url),
    ...new_images.map((f) => URL.createObjectURL(f)),
  ];

  const go_to = (next_idx: number) => {
    if (!carousel_ref.current || all_image_urls.length === 0) return;
    const total = all_image_urls.length;
    const clamped = ((next_idx % total) + total) % total;
    set_active_idx(clamped);
    carousel_ref.current.scrollTo({
      left: clamped * carousel_ref.current.clientWidth,
      behavior: "smooth",
    });
  };

  const on_scroll = () => {
    if (!carousel_ref.current) return;
    const w = carousel_ref.current.clientWidth;
    const idx = Math.round(carousel_ref.current.scrollLeft / w);
    if (idx !== active_idx) set_active_idx(idx);
  };

  const on_pick_images = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const total = display_images.length + new_images.length;
    const remain = 5 - total;
    if (remain <= 0) {
      alert("이미지는 최대 5장까지 등록할 수 있습니다.");
      e.target.value = "";
      return;
    }
    const sliced = files.slice(0, remain);
    if (files.length > remain) {
      alert(`이미지는 최대 ${remain}장까지 추가할 수 있습니다.`);
    }
    set_new_images((prev) => [...prev, ...sliced]);
    e.target.value = "";
  };

  const remove_display_image = (idx: number) => {
    set_display_images((prev) => prev.filter((_, i) => i !== idx));
  };

  const remove_new_image = (idx: number) => {
    set_new_images((prev) => prev.filter((_, i) => i !== idx));
  };

  const on_save = () => {
    // TODO: API 연결 후 실제 저장 로직으로 교체
    const intro_html = editorRef.current?.getInstance()?.getHTML() || "";
    console.log("[ClubInfoEdit] mock save:", {
      clubId,
      club_name,
      one_line,
      president,
      contact,
      deadline,
      description: intro_html,
      display_images,
      new_images,
    });
    alert("저장 완료 (API 미연결 — 콘솔 확인)");
  };

  const total_images = display_images.length + new_images.length;
  const can_add_more = total_images < 5;

  return (
    <div className="cie_page">
      <header className="page-header sticky-header safe-area-top cie_header">
        <div className="container">
          <div className="page-header-content">
            <button
              type="button"
              className="back-btn"
              aria-label="뒤로가기"
              onClick={() => navigate(clubId ? `/club/${clubId}` : "/")}
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
            <h1>동아리 정보 수정</h1>
            <button type="button" className="cie_save_btn" onClick={on_save}>
              저장
            </button>
          </div>
        </div>
      </header>

      <main className="cie_main safe-area-padding">
        <div className="container">

          {/* ===== 갤러리 카드 ===== */}
          <section className="gallery card">
            {all_image_urls.length === 0 ? (
              <div className="no_image">등록된 이미지가 없습니다.</div>
            ) : (
              <>
                <div
                  className="carousel"
                  ref={carousel_ref}
                  onScroll={on_scroll}
                >
                  {all_image_urls.map((src, i) => (
                    <div className="slide" key={i}>
                      <img src={src} alt={`이미지 ${i + 1}`} />
                    </div>
                  ))}
                </div>

                {all_image_urls.length > 1 && (
                  <>
                    <button
                      className="nav prev"
                      onClick={() => go_to(active_idx - 1)}
                      aria-label="이전 이미지"
                    >
                      ‹
                    </button>
                    <button
                      className="nav next"
                      onClick={() => go_to(active_idx + 1)}
                      aria-label="다음 이미지"
                    >
                      ›
                    </button>
                    <div className="dots">
                      {all_image_urls.map((_, i) => (
                        <button
                          key={i}
                          className={i === active_idx ? "is_active" : ""}
                          aria-label={`${i + 1}번째 이미지`}
                          onClick={() => go_to(i)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* 이미지 관리 패널 */}
            <div className="img_manage">
              <div className="img_manage_header">
                <span className="img_manage_count">
                  {total_images} / 5장
                </span>
                <label
                  className={`img_add_btn${can_add_more ? "" : " disabled"}`}
                  htmlFor="cie_img_input"
                >
                  + 이미지 추가
                </label>
                <input
                  id="cie_img_input"
                  type="file"
                  accept="image/png, image/jpeg"
                  multiple
                  disabled={!can_add_more}
                  onChange={on_pick_images}
                  style={{ display: "none" }}
                />
              </div>

              {(display_images.length > 0 || new_images.length > 0) && (
                <ul className="img_list">
                  {display_images.map((img, idx) => (
                    <li key={`d-${idx}`} className="img_item">
                      <span className="img_name">{to_display_name(img.key || img.url)}</span>
                      <button
                        type="button"
                        className="img_remove"
                        onClick={() => remove_display_image(idx)}
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                  {new_images.map((f, idx) => (
                    <li key={`n-${idx}`} className="img_item img_item--new">
                      <span className="img_name">{f.name}</span>
                      <button
                        type="button"
                        className="img_remove"
                        onClick={() => remove_new_image(idx)}
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* ===== 기본 정보 카드 ===== */}
          <section className="club_meta card">
            <ul className="info_list">
              <li>
                <span className="label">동아리명</span>
                <input
                  className="val_input"
                  type="text"
                  value={club_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set_club_name(e.target.value)}
                  placeholder="동아리명"
                />
              </li>
              <li>
                <span className="label">한줄 소개</span>
                <input
                  className="val_input"
                  type="text"
                  value={one_line}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set_one_line(e.target.value)}
                  placeholder="한줄 소개"
                />
              </li>
              <li>
                <span className="label">회장</span>
                <input
                  className="val_input"
                  type="text"
                  value={president}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set_president(e.target.value)}
                  placeholder="회장 이름"
                />
              </li>
              <li>
                <span className="label">연락처</span>
                <input
                  className="val_input"
                  type="tel"
                  value={contact}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set_contact(e.target.value)}
                  placeholder="010-0000-0000"
                />
              </li>
              <li>
                <span className="label">모집 마감</span>
                <input
                  className="val_input val_input--date"
                  type="date"
                  value={deadline}
                  min={today_str}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => set_deadline(e.target.value)}
                />
              </li>
            </ul>
          </section>

          {/* ===== 동아리 소개 카드 ===== */}
          <section className="intro card">
            <h2 className="section_title">동아리 소개</h2>

            <div
              className={[
                "editor_shell",
                is_fullscreen ? "editor_fullscreen" : "",
              ].join(" ")}
            >
              <div className="editor_topbar">
                <button
                  type="button"
                  className="mini_btn"
                  onClick={() => set_show_preview((v) => !v)}
                >
                  {show_preview ? "프리뷰 숨기기" : "프리뷰 보기"}
                </button>
                <button
                  type="button"
                  className="mini_btn"
                  onClick={() => {
                    set_is_fullscreen((v) => !v);
                    setTimeout(() => {
                      const html = editorRef.current?.getInstance()?.getHTML() || "";
                      set_preview_html(html);
                    }, 0);
                  }}
                >
                  {is_fullscreen ? "전체화면 닫기 (ESC)" : "전체화면"}
                </button>
              </div>

              <div className={["editor_grid", show_preview ? "with_preview" : "no_preview"].join(" ")}>
                <div className="editor_col">
                  <Editor
                    key={editor_html}
                    ref={editorRef}
                    initialValue={editor_html}
                    height={is_fullscreen ? "74vh" : "420px"}
                    initialEditType="wysiwyg"
                    previewStyle="tab"
                    usageStatistics={false}
                    placeholder="동아리 소개와 활동 내용을 자유롭게 작성하세요."
                    onChange={sync_preview}
                  />
                </div>

                {show_preview && (
                  <div className="preview_col">
                    <div className="preview_title">실제 화면 미리보기</div>
                    <div className="club_description preview_box">
                      <div
                        className="desc rich_desc"
                        dangerouslySetInnerHTML={{ __html: preview_html || "<p></p>" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>
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
