// src/pages/admin_dashboard/admin_dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./admin_dashboard.css";
import {
  apiLogout,
  fetch_auth_me,
  fetch_owner_club_detail,
  fetch_owner_applicants,
  owner_set_recruitment,
} from "../../lib/api";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

function get_calendar_days(year, month) {
  const first_day = new Date(year, month, 1);
  const last_day = new Date(year, month + 1, 0);
  const start_offset = (first_day.getDay() + 6) % 7;
  const days = [];
  for (let i = 0; i < start_offset; i++) days.push(null);
  for (let d = 1; d <= last_day.getDate(); d++) days.push(d);
  return days;
}

function to_date_str(year, month, day) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function get_d_day(end_date_str) {
  if (!end_date_str) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(end_date_str);
  if (isNaN(end.getTime())) return null;
  const diff = Math.round((end - today) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}

function status_label(status) {
  const s = String(status || "").toUpperCase();
  if (s === "OPEN") return "모집중";
  if (s === "CLOSED" || s === "CLOSE") return "모집 마감";
  return "준비중";
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [club_id, set_club_id] = useState(null);
  const [operator_name, set_operator_name] = useState("");
  const [club_status, set_club_status] = useState(null);
  const [club_start_date, set_club_start_date] = useState(null);
  const [club_end_date, set_club_end_date] = useState(null);
  const [applicant_count, set_applicant_count] = useState(0);
  const [loading, set_loading] = useState(true);
  const [error_msg, set_error_msg] = useState("");

  const [show_recruit_form, set_show_recruit_form] = useState(false);
  const [recruit_start, set_recruit_start] = useState("");
  const [recruit_end, set_recruit_end] = useState("");
  const [recruit_saving, set_recruit_saving] = useState(false);

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
        set_operator_name(me?.name || "");

        const [club, applicants] = await Promise.allSettled([
          fetch_owner_club_detail(cid),
          fetch_owner_applicants(cid),
        ]);

        if (club.status === "fulfilled" && club.value) {
          const d = club.value;
          set_club_status(d.status ?? null);
          set_club_start_date(d.startDate ?? null);
          set_club_end_date(d.endDate ?? null);
        }

        if (applicants.status === "fulfilled") {
          const arr = Array.isArray(applicants.value) ? applicants.value : [];
          set_applicant_count(arr.length);
        }
      } catch (e) {
        set_error_msg(e?.message || "데이터를 불러오지 못했습니다.");
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

  const save_recruitment = async () => {
    if (!club_id || !recruit_start || !recruit_end) {
      alert("시작일과 종료일을 모두 입력해주세요.");
      return;
    }
    set_recruit_saving(true);
    try {
      const result = await owner_set_recruitment(club_id, {
        startDate: new Date(recruit_start).toISOString(),
        endDate: new Date(recruit_end).toISOString(),
      });
      set_club_status(result?.status ?? "OPEN");
      set_club_start_date(result?.startDate ?? recruit_start);
      set_club_end_date(result?.endDate ?? recruit_end);
      set_show_recruit_form(false);
      alert("모집 기간이 설정되었습니다.");
    } catch (e) {
      alert(e?.message || "모집 설정에 실패했습니다.");
    } finally {
      set_recruit_saving(false);
    }
  };

  const close_recruitment = async () => {
    if (!club_id) return;
    if (!window.confirm("모집을 마감하시겠습니까?")) return;
    set_recruit_saving(true);
    try {
      const now = new Date().toISOString();
      const result = await owner_set_recruitment(club_id, {
        startDate: club_start_date || now,
        endDate: now,
      });
      set_club_status(result?.status ?? "CLOSED");
      set_club_end_date(result?.endDate ?? now);
    } catch (e) {
      alert(e?.message || "모집 마감에 실패했습니다.");
    } finally {
      set_recruit_saving(false);
    }
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
  const event_map = {};
  if (club_start_date) {
    const s = club_start_date.slice(0, 10);
    event_map[s] = "open";
  }
  if (club_end_date) {
    const e = club_end_date.slice(0, 10);
    event_map[e] = "deadline";
  }

  const is_open = String(club_status || "").toUpperCase() === "OPEN";

  return (
    <div className="adm-root">
      <header className="adm-header">
        <div className="adm-header-inner">
          <div className="adm-header-brand">
            <img src="/images/2.png" alt="SMU Club 로고" className="adm-logo" />
            {operator_name && <span className="adm-header-name">{operator_name}님</span>}
          </div>
          <button type="button" className="adm-logout-btn" onClick={on_logout}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            로그아웃
          </button>
        </div>
      </header>

      <main className="adm-main">
        {error_msg && <p style={{ color: "#a82d2f", textAlign: "center", padding: "8px" }}>{error_msg}</p>}

        <div className="adm-summary-grid">
          <div className="adm-summary-card">
            <div className="adm-summary-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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

        <div className="adm-body-grid">
          {/* 좌측: 동아리 관리 */}
          <div className="adm-panel">
            <div className="adm-recruit-status">
              <div className="adm-recruit-status-info">
                <span className="adm-recruit-label">현재 상태</span>
                <span className="adm-recruit-state">
                  {loading ? "불러오는 중..." : status_label(club_status)}
                </span>
              </div>
              <div className="adm-recruit-btns">
                <button
                  type="button"
                  className="adm-btn-start"
                  disabled={recruit_saving}
                  onClick={() => set_show_recruit_form((v) => !v)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  모집시작
                </button>
                <button
                  type="button"
                  className="adm-btn-close"
                  disabled={recruit_saving || !is_open}
                  onClick={close_recruitment}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  모집마감
                </button>
              </div>
            </div>

            {show_recruit_form && (
              <div className="adm-recruit-form">
                <label className="adm-recruit-form-label">
                  시작일
                  <input
                    type="date"
                    className="adm-recruit-form-input"
                    value={recruit_start}
                    onChange={(e) => set_recruit_start(e.target.value)}
                  />
                </label>
                <label className="adm-recruit-form-label">
                  종료일
                  <input
                    type="date"
                    className="adm-recruit-form-input"
                    value={recruit_end}
                    onChange={(e) => set_recruit_end(e.target.value)}
                  />
                </label>
                <div className="adm-recruit-form-btns">
                  <button
                    type="button"
                    className="adm-btn-start"
                    onClick={save_recruitment}
                    disabled={recruit_saving}
                  >
                    {recruit_saving ? "저장중..." : "저장"}
                  </button>
                  <button
                    type="button"
                    className="adm-btn-close"
                    onClick={() => set_show_recruit_form(false)}
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

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
              <li className="adm-menu-item" onClick={() => club_id && navigate(`/admin/apply_form_edit/${club_id}`)}>
                <div className="adm-menu-item-text">
                  <span className="adm-menu-item-name">지원서 양식 수정</span>
                  <span className="adm-menu-item-desc">동아리 지원을 위한 지원서 양식을 수정합니다</span>
                </div>
                <svg className="adm-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </li>
            </ul>
          </div>

          {/* 중앙: 지원자 관리 */}
          <div className="adm-panel">
            <div className="adm-applicant-count">
              <span className="adm-applicant-count-label">현재 지원자 수</span>
              <span className="adm-applicant-count-num">
                {loading ? "-" : `${applicant_count}명`}
              </span>
            </div>
            <ul className="adm-menu-list">
              <li className="adm-menu-item" onClick={() => club_id && navigate(`/admin/applicant_manage/${club_id}`)}>
                <div className="adm-menu-item-text">
                  <span className="adm-menu-item-name">지원자 목록보기</span>
                  <span className="adm-menu-item-desc">지원자를 조회합니다</span>
                </div>
                <svg className="adm-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </li>
              <li className="adm-menu-item">
                <div className="adm-menu-item-text">
                  <span className="adm-menu-item-name">지원자 최종 알림</span>
                  <span className="adm-menu-item-desc">합격자 발표 및 안내</span>
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
