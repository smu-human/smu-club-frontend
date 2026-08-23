// src/pages/admin_dashboard/admin_dashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./admin_dashboard.css";
import {
  apiLogout,
  fetch_auth_me,
  fetch_owner_club_detail,
} from "../../lib/api";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

function get_calendar_days(year: number, month: number): (number | null)[] {
  const first_day = new Date(year, month, 1);
  const last_day = new Date(year, month + 1, 0);
  const start_offset = (first_day.getDay() + 6) % 7;
  const days: (number | null)[] = [];
  for (let i = 0; i < start_offset; i++) days.push(null);
  for (let d = 1; d <= last_day.getDate(); d++) days.push(d);
  return days;
}

function to_date_str(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function get_d_day(end_date_str: string | null): number | null {
  if (!end_date_str) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(end_date_str);
  if (isNaN(end.getTime())) return null;
  const diff = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

function status_label(status: string | null | undefined): string {
  const s = String(status || "").toUpperCase();
  if (s === "OPEN") return "모집중";
  if (s === "CLOSED" || s === "CLOSE") return "모집 마감";
  return "준비중";
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [club_id, set_club_id] = useState<number | null>(null);
const [club_status, set_club_status] = useState<string | null>(null);
  const [club_start_date, set_club_start_date] = useState<string | null>(null);
  const [club_end_date, set_club_end_date] = useState<string | null>(null);
  const [loading, set_loading] = useState(true);
  const [error_msg, set_error_msg] = useState("");

  const [cal_year, set_cal_year] = useState(today.getFullYear());
  const [cal_month, set_cal_month] = useState(today.getMonth());

  useEffect(() => {
    const load = async () => {
      set_loading(true);
      try {
        const me = await fetch_auth_me();
        const cid = me?.operatorId;
        if (!cid) throw new Error("operatorId를 가져오지 못했습니다.");
        set_club_id(cid);

        const club = await fetch_owner_club_detail(cid).catch(() => null);

        if (club) {
          set_club_status(club.status ?? null);
          set_club_start_date(club.startDate ?? null);
          set_club_end_date(club.endDate ?? null);
        }
      } catch (err: unknown) {
        const e = err as Error;
        set_error_msg(e.message || "데이터를 불러오지 못했습니다.");
      } finally {
        set_loading(false);
      }
    };
    load();
  }, []);

  const on_logout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      void e;
    }
    navigate("/admin/login", { replace: true });
  };

  const prev_month = () => {
    if (cal_month === 0) { set_cal_year(cal_year - 1); set_cal_month(11); }
    else set_cal_month(cal_month - 1);
  };
  const next_month = () => {
    if (cal_month === 11) { set_cal_year(cal_year + 1); set_cal_month(0); }
    else set_cal_month(cal_month + 1);
  };

  const calendar_days = get_calendar_days(cal_year, cal_month);
  const d_day = get_d_day(club_end_date);

  const today_str = to_date_str(today.getFullYear(), today.getMonth(), today.getDate());

  // 달력에 모집 시작/종료 날짜 표시
  const event_map: Record<string, string> = {};
  if (club_start_date) {
    const s = club_start_date.slice(0, 10);
    event_map[s] = "open";
  }
  if (club_end_date) {
    const e = club_end_date.slice(0, 10);
    event_map[e] = "deadline";
  }

  return (
    <div className="adm-root">
      <header className="adm-header">
        <div className="adm-header-inner">
          <div className="adm-header-brand">
            <img src="/images/2.png" alt="SMU Club 로고" className="adm-logo" />
          </div>
          <div className="adm-header-actions">
            <button type="button" className="adm-logout-btn" onClick={on_logout}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="adm-main">
        {error_msg && <p style={{ color: "#a82d2f", textAlign: "center", padding: "8px" }}>{error_msg}</p>}

        <div className="adm-body-grid">
          {/* 좌측: 동아리 페이지 미리보기 (2행 스팬) */}
          <div className="adm-panel adm-panel-preview">
            {club_id ? (
              <iframe
                src={`/club/${club_id}?preview=1`}
                title="동아리 페이지 미리보기"
                className="adm-preview-iframe"
              />
            ) : (
              <div className="adm-preview-placeholder">
                {loading ? "불러오는 중..." : "동아리 정보를 불러올 수 없습니다."}
              </div>
            )}
          </div>

          {/* 우측 상단: 동아리 관리 */}
          <div className="adm-panel">
            <div className="adm-recruit-status">
              <div className="adm-recruit-status-info">
                <span className="adm-recruit-label">현재 상태</span>
                <span className="adm-recruit-state">
                  {loading ? "불러오는 중..." : status_label(club_status)}
                </span>
              </div>
            </div>

            <ul className="adm-menu-list">
              <li className="adm-menu-item" onClick={() => club_id && navigate(`/club/${club_id}`)}>
                <div className="adm-menu-item-text">
                  <span className="adm-menu-item-name">동아리 페이지</span>
                  <span className="adm-menu-item-desc">동아리 페이지를 확인합니다</span>
                </div>
                <svg className="adm-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </li>
              <li className="adm-menu-item" onClick={() => club_id && navigate(`/admin/club_info_edit/${club_id}`)}>
                <div className="adm-menu-item-text">
                  <span className="adm-menu-item-name">동아리 정보 수정</span>
                  <span className="adm-menu-item-desc">동아리 정보 및 상태를 변경합니다</span>
                </div>
                <svg className="adm-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </li>
              <li className="adm-menu-item" onClick={() => navigate("/admin/mypage")}>
                <div className="adm-menu-item-text">
                  <span className="adm-menu-item-name">비밀번호 수정</span>
                  <span className="adm-menu-item-desc">관리자 비밀번호를 변경합니다</span>
                </div>
                <svg className="adm-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </li>
            </ul>
          </div>

          {/* 우측: 달력 */}
          <div className="adm-panel adm-panel-calendar">
            <div className="adm-dday-badge">
              <span className="adm-dday-label">모집 마감까지</span>
              {d_day !== null && <span className="adm-dday-count">D-{d_day}</span>}
            </div>

            <div className="adm-cal-header">
              <button type="button" className="adm-cal-nav" onClick={prev_month}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="adm-cal-month">{cal_year}년 {cal_month + 1}월</span>
              <button type="button" className="adm-cal-nav" onClick={next_month}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            <div className="adm-cal-grid">
              {DAY_LABELS.map((d) => (
                <div key={d} className="adm-cal-day-label">{d}</div>
              ))}
              {calendar_days.map((day, idx) => {
                if (day === null) return <div key={`empty-${idx}`} className="adm-cal-cell adm-cal-cell-empty" />;
                const date_str = to_date_str(cal_year, cal_month, day);
                const is_today = date_str === today_str;
                const event_type = event_map[date_str];
                return (
                  <div key={date_str} className={`adm-cal-cell${is_today ? " adm-cal-today" : ""}`}>
                    <span className="adm-cal-num">{day}</span>
                    {event_type && <span className={`adm-cal-dot adm-cal-dot-${event_type}`} />}
                  </div>
                );
              })}
            </div>

            <div className="adm-cal-legend">
              <span className="adm-legend-item">
                <span className="adm-cal-dot adm-cal-dot-open" />오픈
              </span>
              <span className="adm-legend-item">
                <span className="adm-cal-dot adm-cal-dot-deadline" />마감일
              </span>
            </div>
          </div>
        </div>
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
