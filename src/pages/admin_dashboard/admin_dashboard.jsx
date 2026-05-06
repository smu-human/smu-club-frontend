// src/pages/admin_dashboard/admin_dashboard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./admin_dashboard.css";
import { apiLogout } from "../../lib/api";

const DUMMY_CLUBS = [
  { id: 1, name: "SMU 코딩 클럽", status: "모집중" },
  { id: 2, name: "SMU 사진 동아리", status: "모집마감" },
  { id: 3, name: "SMU 농구부", status: "모집중" },
  { id: 4, name: "SMU 영화 감상회", status: "모집마감" },
  { id: 5, name: "SMU 독서 모임", status: "준비중" },
];

const DUMMY_APPLICANTS_COUNT = 3;

const DUMMY_EVENTS = [
  { date: "2026-04-22", type: "open" },
  { date: "2026-04-30", type: "deadline" },
  { date: "2026-05-10", type: "open" },
  { date: "2026-05-20", type: "deadline" },
];

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

function get_calendar_days(year, month) {
  // month: 0-indexed
  const first_day = new Date(year, month, 1);
  const last_day = new Date(year, month + 1, 0);
  // Monday-first: (getDay() + 6) % 7 → 0=Mon, 6=Sun
  const start_offset = (first_day.getDay() + 6) % 7;
  const days = [];
  for (let i = 0; i < start_offset; i++) days.push(null);
  for (let d = 1; d <= last_day.getDate(); d++) days.push(d);
  return days;
}

function get_d_day() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future_deadlines = DUMMY_EVENTS.filter((e) => e.type === "deadline")
    .map((e) => new Date(e.date))
    .filter((d) => d >= today)
    .sort((a, b) => a - b);
  if (future_deadlines.length === 0) return null;
  const diff = Math.round(
    (future_deadlines[0] - today) / (1000 * 60 * 60 * 24),
  );
  return diff;
}

function to_date_str(year, month, day) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [cal_year, set_cal_year] = useState(today.getFullYear());
  const [cal_month, set_cal_month] = useState(today.getMonth());

  const on_logout = async () => {
    try {
      await apiLogout();
    } catch (_) {
      // 로그아웃 실패해도 토큰은 지워진 상태
    }
    navigate("/admin/login", { replace: true });
  };

  const prev_month = () => {
    if (cal_month === 0) {
      set_cal_year(cal_year - 1);
      set_cal_month(11);
    } else {
      set_cal_month(cal_month - 1);
    }
  };

  const next_month = () => {
    if (cal_month === 11) {
      set_cal_year(cal_year + 1);
      set_cal_month(0);
    } else {
      set_cal_month(cal_month + 1);
    }
  };

  const calendar_days = get_calendar_days(cal_year, cal_month);
  const d_day = get_d_day();

  const event_map = {};
  DUMMY_EVENTS.forEach((e) => {
    event_map[e.date] = e.type;
  });

  const today_str = to_date_str(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return (
    <div className="adm-root">
      {/* 헤더 */}
      <header className="adm-header">
        <div className="adm-header-inner">
          <div className="adm-header-brand">
            <img src="/images/2.png" alt="SMU Club 로고" className="adm-logo" />
          </div>
          <button type="button" className="adm-logout-btn" onClick={on_logout}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            로그아웃
          </button>
        </div>
      </header>

      <main className="adm-main">
        {/* 상단 Summary Cards */}
        <div className="adm-summary-grid">
          <div className="adm-summary-card">
            <div className="adm-summary-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="adm-summary-text">
              <span className="adm-summary-label">동아리 관리</span>
            </div>
          </div>
          <div className="adm-summary-card">
            <div className="adm-summary-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <div className="adm-summary-text">
              <span className="adm-summary-label">지원자 관리</span>
            </div>
          </div>
          <div className="adm-summary-card">
            <div className="adm-summary-icon">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <polyline points="9 16 11 18 15 14" />
              </svg>
            </div>
            <div className="adm-summary-text">
              <span className="adm-summary-label">일정</span>
            </div>
          </div>
        </div>

        {/* 본문 3단 */}
        <div className="adm-body-grid">
          {/* 좌측: 동아리 관리 */}
          <div className="adm-panel">
            {/* <h2 className="adm-panel-title">동아리 관리</h2> */}
            <ul className="adm-menu-list">
              <li
                className="adm-menu-item"
                onClick={() => navigate("/admin/club_register")}
              >
                <div className="adm-menu-item-text">
                  <span className="adm-menu-item-name">동아리 페이지</span>
                  <span className="adm-menu-item-desc">
                    동아리 페이지를 확인합니다
                  </span>
                </div>
                <svg
                  className="adm-chevron"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </li>
              <li className="adm-menu-item" onClick={() => navigate("/admin/club_info_edit/1")}>
                <div className="adm-menu-item-text">
                  <span className="adm-menu-item-name">동아리 정보 수정</span>
                  <span className="adm-menu-item-desc">
                    동아리 정보 및 상태를 변경합니다
                  </span>
                </div>
                <svg
                  className="adm-chevron"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </li>
              <li className="adm-menu-item" onClick={() => navigate("/admin/apply_form_edit/1")}>
                <div className="adm-menu-item-text">
                  <span className="adm-menu-item-name">지원서 양식 수정</span>
                  <span className="adm-menu-item-desc">
                    동아리 지원을 위한 지원서 양식을 수정합니다
                  </span>
                </div>
                <svg
                  className="adm-chevron"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </li>
            </ul>

            <div className="adm-recruit-status">
              <span className="adm-recruit-label">현재 상태</span>
              <span className="adm-recruit-state">모집 마감</span>
            </div>

            <div className="adm-recruit-btns">
              <button type="button" className="adm-btn-start">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                모집시작
              </button>
              <button type="button" className="adm-btn-close">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                모집마감
              </button>
            </div>
          </div>

          {/* 중앙: 지원자 관리 */}
          <div className="adm-panel">
            {/* <h2 className="adm-panel-title">지원자 관리</h2> */}
            <div className="adm-applicant-count">
              <span className="adm-applicant-count-label">현재 지원자 수</span>
              <span className="adm-applicant-count-num">{DUMMY_APPLICANTS_COUNT}명</span>
            </div>
            <ul className="adm-menu-list">
              <li
                className="adm-menu-item"
                onClick={() => navigate("/admin/applicant_manage/1")}
              >
                <div className="adm-menu-item-text">
                  <span className="adm-menu-item-name">지원자 목록보기</span>
                  <span className="adm-menu-item-desc">
                    지원자를 조회합니다
                  </span>
                </div>
                <svg
                  className="adm-chevron"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </li>

              <li className="adm-menu-item">
                <div className="adm-menu-item-text">
                  <span className="adm-menu-item-name">지원자 최종 알림</span>
                  <span className="adm-menu-item-desc">
                    합격자 발표 및 안내
                  </span>
                </div>
                <svg
                  className="adm-chevron"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </li>
            </ul>
          </div>

          {/* 우측: 달력 */}
          <div className="adm-panel adm-panel-calendar">
            <div className="adm-dday-badge">
              <span className="adm-dday-label">모집 마감까지</span>
              {d_day !== null && (
                <span className="adm-dday-count">D-{d_day}</span>
              )}
            </div>

            <div className="adm-cal-header">
              <button
                type="button"
                className="adm-cal-nav"
                onClick={prev_month}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="adm-cal-month">
                {cal_year}년 {cal_month + 1}월
              </span>
              <button
                type="button"
                className="adm-cal-nav"
                onClick={next_month}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            <div className="adm-cal-grid">
              {DAY_LABELS.map((d) => (
                <div key={d} className="adm-cal-day-label">
                  {d}
                </div>
              ))}
              {calendar_days.map((day, idx) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="adm-cal-cell adm-cal-cell-empty"
                    />
                  );
                }
                const date_str = to_date_str(cal_year, cal_month, day);
                const is_today = date_str === today_str;
                const event_type = event_map[date_str];
                return (
                  <div
                    key={date_str}
                    className={`adm-cal-cell${is_today ? " adm-cal-today" : ""}`}
                  >
                    <span className="adm-cal-num">{day}</span>
                    {event_type && (
                      <span
                        className={`adm-cal-dot adm-cal-dot-${event_type}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="adm-cal-legend">
              <span className="adm-legend-item">
                <span className="adm-cal-dot adm-cal-dot-open" />
                오픈
              </span>
              <span className="adm-legend-item">
                <span className="adm-cal-dot adm-cal-dot-deadline" />
                마감일
              </span>
            </div>
          </div>
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
