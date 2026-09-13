// src/components/notice_modal.tsx
import { useEffect, useRef } from "react";
import type { Notice } from "../lib/types";
import "./notice_modal.css";

interface Props {
  notice: Notice | null;
  onClose: () => void;
}

function fmt_date(v: string | undefined): string {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd}`;
}

/**
 * 공지 상세 모달. 모바일은 전체 시트, 데스크톱은 가운데 다이얼로그.
 *
 * 열고 닫는 것은 홈의 URL(`?notice={id}`)이 정한다. 그래야 모바일에서
 * 뒤로가기로 닫을 수 있고, 링크로 공유해도 같은 공지가 열린다.
 * 기존 `components/result.tsx`는 고정 높이 결과 팝업이라 재사용하지 않는다.
 */
export default function NoticeModal({ notice, onClose }: Props) {
  const close_ref = useRef<HTMLButtonElement>(null);
  const notice_id = notice?.id ?? null;

  // onClose를 effect 의존성에 두면, 부모가 매 렌더마다 새 함수를 넘기는 순간
  // 열려 있는 동안에도 cleanup이 돌아 포커스를 배너로 되돌려 버린다.
  // 최신 콜백은 ref로 들고, effect는 "어떤 공지가 열렸는가"에만 반응하게 한다.
  const on_close_ref = useRef(onClose);
  on_close_ref.current = onClose;

  useEffect(() => {
    if (notice_id == null) return;

    close_ref.current?.focus();

    const on_key = (e: KeyboardEvent) => {
      if (e.key === "Escape") on_close_ref.current();
    };
    document.addEventListener("keydown", on_key);

    // 시트 뒤의 목록이 같이 스크롤되면 어디를 보고 있었는지 잃어버린다.
    const prev_overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", on_key);
      document.body.style.overflow = prev_overflow;
      // 닫은 뒤 포커스를 눌렀던 배너로 돌려준다(키보드/스크린리더 사용자가 길을 잃지 않게).
      const trigger = document.querySelector<HTMLElement>(
        `[data-notice-id="${notice_id}"]`,
      );
      trigger?.focus();
    };
  }, [notice_id]);

  if (!notice) return null;

  const date_text = fmt_date(notice.createdAt);

  return (
    <div
      className="nm_backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="nm_sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nm_heading"
      >
        <div className="nm_header">
          <span className="nm_title">공지</span>
          <button
            type="button"
            className="nm_close"
            ref={close_ref}
            onClick={onClose}
            aria-label="공지 닫기"
          >
            ✕
          </button>
        </div>

        <div className="nm_body">
          <img className="nm_img" src={notice.imageUrl} alt={notice.title} />

          <div className="nm_content">
            <h2 className="nm_heading" id="nm_heading">
              {notice.title}
            </h2>
            {date_text && <p className="nm_date">{date_text}</p>}
            {/* body는 평문이다. HTML로 렌더하지 않고 줄바꿈만 CSS로 살린다. */}
            <p className="nm_text">{notice.body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
