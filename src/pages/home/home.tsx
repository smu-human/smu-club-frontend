// src/pages/home/home.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/globals.css";
import "./home.css";
import { fetch_public_clubs } from "../../lib/api";
import { ClubListItem } from "../../lib/types";

interface ClubItem {
  id: number;
  name: string;
  status: string;
  members: number | null;
  dday: number | null;
  deadline: string | null;
  desc: string;
  logo: string;
}

// function ddayClass(d: number | null): string { ... }
// function ddayLabel(d: number | null): string { ... }

const DEFAULT_LOGO = "/images/2.png";

const THUMB_BASE_URL =
  import.meta.env.VITE_THUMBNAIL_BASE_URL ||
  import.meta.env.VITE_S3_BASE_URL ||
  "";

function normalize_img_url(url: unknown): string | null {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;
  if (s === "string") return null;

  if (s.startsWith("http://") || s.startsWith("https://")) {
    const second = s.indexOf("https://", 1);
    return second > 0 ? s.slice(second) : s;
  }
  if (s.startsWith("/")) return s;

  if (THUMB_BASE_URL) {
    const base = String(THUMB_BASE_URL).replace(/\/+$/, "");
    const key = s.replace(/^\/+/, "");
    return `${base}/${key}`;
  }

  return s;
}

function pick_thumbnail(item: ClubListItem): string | null {
  return normalize_img_url(item?.thumbnailUrl);
}

export default function HomePage() {
  const nav = useNavigate();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string>("default");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [sort_open, set_sort_open] = useState(false);
  const sort_ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sort_ref.current && !sort_ref.current.contains(e.target as Node)) {
        set_sort_open(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const SORT_OPTIONS = [
    { value: "default", label: "기본순" },
    { value: "name", label: "이름순" },
  ];

  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [is_loading, set_is_loading] = useState(false);
  const [error_msg, set_error_msg] = useState("");

  useEffect(() => {
    const load = async () => {
      set_is_loading(true);
      set_error_msg("");

      try {
        const data = await fetch_public_clubs();

        const mapped = (Array.isArray(data) ? data : []).map((item) => {
          const thumb = pick_thumbnail(item);

          return {
            id: item?.id,
            name: item?.name || "",
            status: (item?.recruitingStatus || "").toLowerCase(),
            members: null,
            dday: null,
            deadline: null,
            desc: item?.title || "",
            logo: thumb || DEFAULT_LOGO,
          };
        });

        setClubs(mapped.filter((c) => c.id != null));
      } catch (err) {
        set_error_msg(
          (err as Error & { code?: string }).message ||
            "동아리 목록을 불러오지 못했습니다.",
        );
      } finally {
        set_is_loading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...clubs];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.desc || "").toLowerCase().includes(q),
      );
    }
    if (onlyOpen) {
      list = list.filter((c) => c.status === "open");
    }

    if (sortKey === "name") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    // "default": API 응답 순서 유지 (정렬 없음)

    return list;
  }, [query, onlyOpen, sortKey, clubs]);

  return (
    <div className="home_page">
      <header className="page-header">
        <div className="brand_row">
          <button
            type="button"
            className="logo_btn"
            onClick={() => window.location.reload()}
            aria-label="SMU club 홈 새로고침"
          >
            <img src={DEFAULT_LOGO} alt="SMU club 로고" className="logo_img" />
          </button>

          <div className="header_actions">
            <Link to="/admin/login" className="btn primary">
              동아리장 로그인
            </Link>
          </div>
        </div>

        <div className="search_row">
          <svg
            className="icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <input
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setQuery(e.target.value)
            }
            className="search_input"
            placeholder="통합 검색"
          />
        </div>

        <div className="toolbar">
          <div className="stat">총 {clubs.length}개의 동아리</div>

          <div className="right_controls">
            {/* <label className="toggle">
              <input
                type="checkbox"
                checked={onlyOpen}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOnlyOpen(e.target.checked)
                }
              />
              <span>신청가능</span>
            </label> */}

            <div className="sort_dropdown" ref={sort_ref}>
              <button
                type="button"
                className="sort_trigger"
                onClick={() => set_sort_open((v) => !v)}
              >
                {SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? "정렬"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {sort_open && (
                <ul className="sort_menu">
                  {SORT_OPTIONS.map((o) => (
                    <li
                      key={o.value}
                      className={`sort_option${sortKey === o.value ? " active" : ""}`}
                      onClick={() => { setSortKey(o.value); set_sort_open(false); }}
                    >
                      {o.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="home_main" aria-busy={is_loading}>
        {error_msg && <div className="error_msg">{error_msg}</div>}

        {is_loading ? (
          /* 카드와 같은 골격의 자리표시자. 목록이 도착해도 레이아웃이 튀지 않는다.
             블록 자체는 장식이라 스크린리더에서 숨기고, 대신 안내 문구를 따로 둔다. */
          <>
            <p className="sr_only" role="status">
              동아리 목록을 불러오는 중
            </p>
            {Array.from({ length: 6 }, (_, i) => (
              <article
                className="club_card club_card--skeleton"
                key={i}
                aria-hidden="true"
              >
                <div className="club_logo skeleton" />
                <div className="skeleton card_skeleton_name" />
                <div className="skeleton card_skeleton_desc" />
              </article>
            ))}
          </>
        ) : (
          <>
            {filtered.map((c) => (
              <article
                key={c.id}
                className="club_card"
                onClick={() => nav(`/club/${c.id}`)}
              >
                <img
                  className="club_logo"
                  src={c.logo}
                  alt={`${c.name} 로고`}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_LOGO;
                  }}
                />
                <h3 className="club_name">{c.name}</h3>
                <p className="club_desc">{c.desc}</p>
              </article>
            ))}

            {filtered.length === 0 && !is_loading && (
              <div className="empty">
                <p>검색 결과가 없습니다.</p>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="page-footer">
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
      </footer>
    </div>
  );
}
