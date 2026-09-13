// src/components/notice_banner.tsx
import { useRef, useState } from "react";
import type { Notice } from "../lib/types";
import "./notice_banner.css";

interface Props {
  notices: Notice[];
  onOpen: (notice: Notice) => void;
}

/**
 * 홈 상단 띠 배너. 이미지가 곧 배너다(문구도 이미지 안에 들어간다).
 *
 * 여러 장이면 가로 스와이프 + dots. 자동 넘김은 두지 않는다 —
 * 읽는 도중에 화면이 바뀌면 오히려 방해가 된다.
 */
export default function NoticeBanner({ notices, onOpen }: Props) {
  const [active, set_active] = useState(0);
  const track_ref = useRef<HTMLDivElement>(null);

  // 공지가 없으면 영역 자체를 렌더하지 않는다(빈 상자를 남기지 않는다).
  if (notices.length === 0) return null;

  const on_scroll = () => {
    const track = track_ref.current;
    if (!track) return;
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    if (idx !== active) set_active(idx);
  };

  const go_to = (idx: number) => {
    const track = track_ref.current;
    if (!track) return;
    set_active(idx);
    track.scrollTo({ left: idx * track.clientWidth, behavior: "smooth" });
  };

  return (
    <section className="nb_wrap" aria-label="공지">
      <div className="nb_track" ref={track_ref} onScroll={on_scroll}>
        {notices.map((n) => (
          <button
            key={n.id}
            type="button"
            className="nb_item"
            data-notice-id={n.id}
            aria-label={`공지 열기: ${n.title}`}
            onClick={() => onOpen(n)}
          >
            <img className="nb_img" src={n.imageUrl} alt={n.title} />
          </button>
        ))}
      </div>

      {notices.length > 1 && (
        <div className="nb_dots">
          {notices.map((n, i) => (
            <button
              key={n.id}
              type="button"
              className={i === active ? "is_active" : ""}
              aria-label={`${i + 1}번째 공지로 이동`}
              onClick={() => go_to(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
