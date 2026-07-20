// src/pages/club/club.tsx (부분 교체: "지원하기" 노출 조건에 모집 시작 여부 추가)

import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useRef, useEffect, useMemo } from "react";
import "../../styles/globals.css";
import "./club.css";
import {
  fetch_public_club,
  fetch_owner_club_detail,
  is_logged_in,
  fetch_owner_managed_clubs,
} from "../../lib/api";
import { Club } from "../../lib/types";

function fmt_date(v: unknown): string {
  if (!v) return "-";
  const s = String(v);
  if (s.includes("T")) return s.split("T")[0];
  return s;
}


export default function ClubPage() {
  const { id } = useParams<{ id?: string }>();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const is_preview = searchParams.get("preview") === "1";

  const [club, setClub] = useState<Club | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error_msg, set_error_msg] = useState("");
  const carouselRef = useRef<HTMLDivElement>(null);

  const [owner_ids, set_owner_ids] = useState<Set<string>>(new Set<string>());

  const is_owner = useMemo(() => owner_ids.has(String(id)), [owner_ids, id]);

  const is_guest = useMemo(() => !is_logged_in(), []);


  useEffect(() => {
    const load_owner = async () => {
      if (!is_logged_in()) {
        set_owner_ids(new Set<string>());
        return;
      }

      try {
        const ownerData = await fetch_owner_managed_clubs().catch(() => null);
        const owners = Array.isArray(ownerData) ? ownerData : [];
        const next_owner = new Set<string>(
          owners
            .map((c: unknown) => (c as Record<string, unknown>)?.clubId ?? (c as Record<string, unknown>)?.id ?? (c as Record<string, unknown>)?.club_id)
            .filter((v: unknown) => v !== undefined && v !== null)
            .map(String),
        );
        set_owner_ids(next_owner);
      } catch {
        set_owner_ids(new Set<string>());
      }
    };

    load_owner();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      set_error_msg("");

      try {
        const logged_in = is_logged_in();

        const data =
          logged_in && is_owner
            ? await fetch_owner_club_detail(id!)
            : await fetch_public_club(id ?? "");

        const club_data = data ?? null;
        setClub(club_data);

        const club_images = Array.isArray(club_data?.clubImages)
          ? club_data.clubImages
          : [];

        const urls_from_club_images = (club_images as unknown[])
          .slice()
          .sort((a, b) => {
            const ao = (a as Record<string, unknown>)?.orderNumber;
            const bo = (b as Record<string, unknown>)?.orderNumber;
            return ((ao as number) ?? 0) - ((bo as number) ?? 0);
          })
          .map((it) => (it as Record<string, unknown>)?.imageUrl)
          .filter((v) => v && String(v).trim() && v !== "string")
          .map(String);

        const thumb =
          club_data?.thumbnailUrl &&
          String(club_data.thumbnailUrl).trim() &&
          club_data.thumbnailUrl !== "string"
            ? club_data.thumbnailUrl
            : null;

        const final_urls: string[] =
          urls_from_club_images.length > 0
            ? urls_from_club_images
            : thumb
              ? [thumb]
              : [];

        setImages(final_urls);

        setActiveIndex(0);
        carouselRef.current?.scrollTo({ left: 0 });
      } catch (err) {
        set_error_msg((err as Error & { code?: string }).message || "동아리 정보를 불러오지 못했습니다.");
        setClub(null);
        setImages([]);
        setActiveIndex(0);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, is_owner]);

  const goTo = (nextIdx: number) => {
    if (!carouselRef.current || images.length === 0) return;
    const total = images.length;
    const clamped = (nextIdx + total) % total;
    setActiveIndex(clamped);

    const slideWidth = carouselRef.current.clientWidth;
    carouselRef.current.scrollTo({
      left: clamped * slideWidth,
      behavior: "smooth",
    });
  };

  const onPrev = () => goTo(activeIndex - 1);
  const onNext = () => goTo(activeIndex + 1);

  const onScroll = () => {
    if (!carouselRef.current) return;
    const slideWidth = carouselRef.current.clientWidth;
    const idx = Math.round(carouselRef.current.scrollLeft / slideWidth);
    if (idx !== activeIndex) setActiveIndex(idx);
  };

  return (
    <div className={`club_page${is_preview ? " club_page--preview" : ""}`}>
      {is_preview && club && (
        <div className="preview-club-name">{club.name}</div>
      )}

      {!is_preview && (
        <header className="page-header sticky-header safe-area-top page-header--club">
          <div className="container">
            <div className="page-header-content">
              <button
                className="back-btn"
                aria-label="뒤로가기"
                onClick={() => nav("/")}
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

              <h1>{club?.name || `클럽 ${id} 상세`}</h1>
            </div>
          </div>
        </header>
      )}

      <main className="club_main safe-area-padding">
        <div className="container">
          {error_msg && (
            <p
              aria-live="polite"
              style={{ minHeight: 20, color: "#a82d2f", marginBottom: "8px" }}
            >
              {error_msg}
            </p>
          )}

          {loading ? (
            <div className="club-loading">동아리 정보를 불러오는 중...</div>
          ) : !club ? (
            <div className="club-empty">동아리 정보를 찾을 수 없습니다.</div>
          ) : (
            <>
              <section className="gallery card">
                {images.length === 0 ? (
                  <div className="no_image">등록된 이미지가 없습니다.</div>
                ) : (
                  <>
                    <div
                      className="carousel"
                      ref={carouselRef}
                      onScroll={onScroll}
                    >
                      {images.map((src, i) => (
                        <div className="slide" key={i}>
                          <img src={src} alt={`클럽 이미지 ${i + 1}`} />
                        </div>
                      ))}
                    </div>

                    {images.length > 1 && (
                      <>
                        <button
                          className="nav prev"
                          onClick={onPrev}
                          aria-label="이전 이미지"
                        >
                          ‹
                        </button>
                        <button
                          className="nav next"
                          onClick={onNext}
                          aria-label="다음 이미지"
                        >
                          ›
                        </button>

                        <div className="dots">
                          {images.map((_, i) => (
                            <button
                              key={i}
                              className={i === activeIndex ? "is_active" : ""}
                              aria-label={`${i + 1}번째 이미지로 이동`}
                              onClick={() => goTo(i)}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                )}
              </section>
              <section className="club_meta card">
                <ul className="info_list">
                  <li>
                    <span className="label">회장</span>
                    <span className="val">
                      {is_guest ? "로그인 필요" : club.president || "-"}
                    </span>
                  </li>

                  <li>
                    <span className="label">연락처</span>
                    <span className="val">
                      {is_guest ? "로그인 필요" : club.contact || "-"}
                    </span>
                  </li>

                  <li>
                    <span className="label">모집 마감</span>
                    <span className="val">{fmt_date(club.recruitingEnd)}</span>
                  </li>
                </ul>
              </section>
              <section className="intro card">
                <h2 className="section_title">동아리 소개</h2>

                {club?.description ? (
                  <div
                    className="desc rich_desc club_description"
                    dangerouslySetInnerHTML={{ __html: club.description }}
                  />
                ) : (
                  <p className="desc">
                    {`이곳에 클럽 ${id}의 소개글을 넣어주세요. 활동 목적, 주요 활동, 성과 등을 적을 수 있습니다.`}
                  </p>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {!is_preview && (
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
      )}
    </div>
  );
}
