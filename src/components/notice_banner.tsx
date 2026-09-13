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

  // 데스크톱에서는 띠가 화면 폭을 채우고 이미지는 가운데에 놓인다.
  // 남는 양옆을 이미지와 같은 색으로 메워야 한 장의 띠처럼 보이므로,
  // 이미지 왼쪽 가장자리 픽셀을 읽어 배경색으로 쓴다(공지마다 색이 다를 수 있다).
  const [edge_colors, set_edge_colors] = useState<Record<number, string>>({});
  // crossOrigin 을 붙이면 CORS 헤더가 없는 이미지는 아예 로드되지 않는다.
  // 그런 경우 색 추출을 포기하고 평범하게 다시 받는다.
  const [no_cors, set_no_cors] = useState<Record<number, boolean>>({});

  const pick_edge_color = (id: number, el: HTMLImageElement) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(el, 0, Math.floor(el.naturalHeight / 2), 1, 1, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      set_edge_colors((prev) =>
        prev[id] ? prev : { ...prev, [id]: `rgb(${r}, ${g}, ${b})` },
      );
    } catch {
      // 캔버스가 오염되어 읽지 못하면 CSS 기본 배경색을 그대로 쓴다.
    }
  };

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
            style={
              edge_colors[n.id] ? { background: edge_colors[n.id] } : undefined
            }
          >
            <img
              className="nb_img"
              src={n.imageUrl}
              alt={n.title}
              crossOrigin={no_cors[n.id] ? undefined : "anonymous"}
              onLoad={(e) => pick_edge_color(n.id, e.currentTarget)}
              onError={() =>
                set_no_cors((prev) =>
                  prev[n.id] ? prev : { ...prev, [n.id]: true },
                )
              }
            />
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
