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

  if (s.startsWith("http://") || s.startsWith("https://")) return s;
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
  const [sortKey, setSortKey] = useState<string>("name");
  const [onlyOpen, setOnlyOpen] = useState(false);

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
      list = list.filter((c) => (c.name || "").toLowerCase().includes(q));
    }
    if (onlyOpen) {
      list = list.filter((c) => c.status === "open");
    }

    list.sort((a, b) => {
      if (sortKey === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortKey === "members") return (b.members ?? 0) - (a.members ?? 0);
      if (sortKey === "dday") return (a.dday ?? 9999) - (b.dday ?? 9999);
      return 0;
    });

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
            placeholder="동아리 이름 검색"
          />
        </div>

        <div className="toolbar">
          <div className="stat">총 {clubs.length}개의 동아리</div>

          <div className="right_controls">
            <label className="toggle">
              <input
                type="checkbox"
                checked={onlyOpen}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOnlyOpen(e.target.checked)
                }
              />
              <span>신청가능</span>
            </label>

            <select
              className="sort_select"
              value={sortKey}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSortKey(e.target.value)
              }
            >
              <option value="name">이름순</option>
              <option value="dday">마감 임박순</option>
            </select>
          </div>
        </div>
      </header>

      <main className="home_main">
        {error_msg && <div className="error_msg">{error_msg}</div>}

        {is_loading ? (
          <div className="list_loading">동아리 목록을 불러오는 중...</div>
        ) : (
          <>
            {filtered.map((c) => (
              <article
                key={c.id}
                className="club_card"
                onClick={() => nav(`/club/${c.id}`)}
              >
                <div className="club_head_row">
                  <img
                    className="club_logo"
                    src={c.logo}
                    alt={`${c.name} 로고`}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = DEFAULT_LOGO;
                    }}
                  />
                  <div className="club_head_left">
                    <h3 className="club_name">{c.name}</h3>
                    <div className="club_meta_row">
                      <span
                        className={`badge ${
                          c.status === "open"
                            ? "open"
                            : c.status === "upcoming"
                              ? "upcoming"
                              : "closed"
                        }`}
                      >
                        {c.status === "open"
                          ? "신청 가능"
                          : c.status === "upcoming"
                            ? "모집 예정"
                            : "신청 불가"}
                      </span>
                      {c.members != null && (
                        <span className="members">· {c.members}명</span>
                      )}
                    </div>
                  </div>
                  {/* <span className={`dday ${ddayClass(c.dday)}`}>
                    {ddayLabel(c.dday)}
                  </span> */}
                </div>

                <p className="club_desc">{c.desc}</p>

                <div className="club_foot_row">
                  {c.deadline && (
                    <span className="deadline">모집마감일 {c.deadline}</span>
                  )}
                </div>
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
