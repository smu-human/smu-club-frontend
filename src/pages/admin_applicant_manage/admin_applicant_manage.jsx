// src/pages/admin_applicant_manage/admin_applicant_manage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./admin_applicant_manage.css";
import {
  fetch_owner_applicants,
  fetch_owner_applicant_detail,
  owner_update_applicant_status,
  owner_download_applicants_excel,
  owner_send_result_email,
} from "../../lib/api";

function normalize_status(s) {
  const v = String(s || "").toUpperCase();
  if (v === "ACCEPTED") return "accepted";
  if (v === "REJECTED") return "rejected";
  if (v === "PENDING") return "pending";
  if (v === "WAITING") return "pending";
  return "pending";
}

function status_label(s) {
  if (s === "accepted") return "합격";
  if (s === "rejected") return "불합격";
  return "미정";
}

function status_to_card_class(s) {
  if (s === "accepted") return "pass";
  if (s === "rejected") return "fail";
  return "pending";
}

export default function AdminApplicantManage() {
  const navigate = useNavigate();
  const { clubId } = useParams();

  const club_id = useMemo(
    () => (clubId == null ? null : String(clubId)),
    [clubId]
  );

  const [applicants, set_applicants] = useState([]);
  const [loading, set_loading] = useState(true);
  const [error_msg, set_error_msg] = useState("");

  const [status_loading_map, set_status_loading_map] = useState({});
  const [excel_loading, set_excel_loading] = useState(false);
  const [email_loading, set_email_loading] = useState(false);

  const [status_map, set_status_map] = useState({});
  const [status_checking, set_status_checking] = useState(false);

  const load_list = async () => {
    if (!club_id) {
      set_loading(false);
      set_applicants([]);
      set_error_msg("club id가 없습니다. (라우트 파라미터 확인 필요)");
      return;
    }

    set_loading(true);
    set_error_msg("");

    try {
      const res = await fetch_owner_applicants(club_id);
      const list = Array.isArray(res) ? res : [];

      const mapped = list
        .map((a) => ({
          clubMemberId: a?.clubMemberId ?? a?.club_member_id ?? a?.id ?? null,
          memberId: a?.memberId ?? a?.member_id ?? null,
          name: a?.name ?? "",
          studentId: a?.studentId ?? a?.student_id ?? "",
          appliedAt: a?.appliedAt ?? a?.applied_at ?? null,
          status: a?.status ? normalize_status(a.status) : null,
        }))
        .filter((x) => x.clubMemberId != null);

      set_applicants(mapped);

      const next_status_map = {};
      for (const a of mapped) {
        if (a.status) next_status_map[String(a.clubMemberId)] = a.status;
      }
      if (Object.keys(next_status_map).length) {
        set_status_map((prev) => ({ ...prev, ...next_status_map }));
      }
    } catch (e) {
      set_error_msg(e?.message || "지원자 목록을 불러오지 못했습니다.");
      set_applicants([]);
      set_status_map({});
    } finally {
      set_loading(false);
    }
  };

  const check_all_statuses = async (list) => {
    if (!club_id) return;

    const arr = Array.isArray(list) ? list : [];
    if (!arr.length) return;

    set_status_checking(true);
    try {
      const results = await Promise.allSettled(
        arr.map(async (a) => {
          const club_member_id = a?.clubMemberId;
          if (!club_member_id) return null;

          const known = status_map[String(club_member_id)] || a?.status;
          if (known) return { clubMemberId: club_member_id, status: known };

          const data = await fetch_owner_applicant_detail(
            club_id,
            club_member_id
          );
          const applicant =
            data?.applicantInfo ??
            data?.applicant ??
            data?.applicant_info ??
            null;

          return {
            clubMemberId: club_member_id,
            status: normalize_status(applicant?.status),
          };
        })
      );

      const next = {};
      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        const v = r.value;
        if (!v?.clubMemberId) continue;
        next[String(v.clubMemberId)] = normalize_status(v.status);
      }

      set_status_map((prev) => ({ ...prev, ...next }));
    } finally {
      set_status_checking(false);
    }
  };

  useEffect(() => {
    load_list();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club_id]);

  useEffect(() => {
    if (loading) return;
    if (error_msg) return;
    if (!applicants?.length) return;

    const all_known = applicants.every((a) => {
      const cid = String(a.clubMemberId);
      return !!(a.status || status_map[cid]);
    });
    if (all_known) return;

    check_all_statuses(applicants);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error_msg, applicants]);

  const update_status = async (club_member_id, next_status) => {
    if (!club_id || !club_member_id) return;

    set_status_loading_map((prev) => ({ ...prev, [club_member_id]: true }));

    try {
      await owner_update_applicant_status(club_id, club_member_id, next_status);

      const normalized = normalize_status(next_status);

      set_status_map((prev) => ({
        ...prev,
        [String(club_member_id)]: normalized,
      }));

      set_applicants((prev) =>
        (prev || []).map((a) =>
          String(a.clubMemberId) === String(club_member_id)
            ? { ...a, status: normalized }
            : a
        )
      );

      alert("상태가 변경되었습니다.");
    } catch (e) {
      alert(e?.message || "상태 변경에 실패했습니다.");
    } finally {
      set_status_loading_map((prev) => ({ ...prev, [club_member_id]: false }));
    }
  };

  const download_excel = async () => {
    if (!club_id) return;
    set_excel_loading(true);
    try {
      await owner_download_applicants_excel(club_id);
    } catch (e) {
      alert(e?.message || "엑셀 다운로드에 실패했습니다.");
    } finally {
      set_excel_loading(false);
    }
  };

  const all_decided = useMemo(() => {
    if (!applicants?.length) return false;
    return applicants.every((a) => {
      const cid = String(a.clubMemberId);
      const s = a.status || status_map[cid] || "pending";
      return s === "accepted" || s === "rejected";
    });
  }, [applicants, status_map]);

  const send_result_email = async () => {
    if (!club_id) return;

    if (!all_decided) {
      alert("모든 지원자의 합/불이 결정된 후에 메일을 발송할 수 있습니다.");
      return;
    }

    set_email_loading(true);
    try {
      await owner_send_result_email(club_id);
      alert("합불 결과 메일 발송 요청 완료");
    } catch (e) {
      alert(e?.message || "메일 발송에 실패했습니다.");
    } finally {
      set_email_loading(false);
    }
  };

  const go_apply_form = (club_member_id) => {
    if (!club_id || !club_member_id) return;
    navigate(`/apply_form/${club_id}/${String(club_member_id)}`);
  };

  return (
    <div className="adm-ap-root">
      {/* 헤더 */}
      <header className="adm-ap-header">
        <div className="adm-ap-header-inner">
          <button
            type="button"
            className="adm-ap-back-btn"
            aria-label="뒤로가기"
            onClick={() => navigate("/admin/dashboard")}
          >
            <svg
              className="adm-ap-back-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <img src="/images/2.png" alt="SMU Club 로고" className="adm-ap-logo" />
        </div>
      </header>

      <main className="adm-ap-main">
        <div className="adm-ap-section">
          <h2 className="adm-ap-title">지원자 목록</h2>

          <div className="adm-ap-toolbar">
            <p className="adm-ap-hint">
              지원자를 클릭하면 지원서를 확인할 수 있습니다.
              {status_checking && <span className="adm-ap-checking"> 상태 확인 중...</span>}
            </p>
            <div className="adm-ap-actions">
              <button
                type="button"
                className="adm-ap-btn adm-ap-btn-excel"
                onClick={download_excel}
                disabled={excel_loading}
              >
                {excel_loading ? "다운로드 중..." : "엑셀 다운로드"}
              </button>
              <button
                type="button"
                className="adm-ap-btn adm-ap-btn-mail"
                onClick={send_result_email}
                disabled={email_loading}
                style={{ opacity: email_loading ? 0.6 : all_decided ? 1 : 0.35 }}
                title={
                  all_decided
                    ? "합불 결과 메일 발송"
                    : "모든 지원자의 합/불을 결정해야 발송할 수 있습니다."
                }
              >
                {email_loading ? "발송 중..." : "합불결과 메일 발송"}
              </button>
            </div>
          </div>

          <div className="adm-ap-list">
            {loading ? (
              <div className="adm-ap-empty">불러오는 중...</div>
            ) : error_msg ? (
              <div className="adm-ap-empty">{error_msg}</div>
            ) : applicants.length === 0 ? (
              <div className="adm-ap-empty">지원자가 없습니다.</div>
            ) : (
              applicants.map((a) => {
                const cid = String(a.clubMemberId);
                const s = status_map[cid] ?? a.status ?? "pending";

                return (
                  <button
                    key={cid}
                    type="button"
                    className="adm-ap-card"
                    onClick={() => go_apply_form(a.clubMemberId)}
                  >
                    <span className="adm-ap-card-info">
                      {a.name}
                      <span className="adm-ap-card-studentid">{a.studentId}</span>
                    </span>
                    <span className={`adm-ap-badge adm-ap-badge-${status_to_card_class(s)}`}>
                      {status_label(s)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </main>

      <div className="adm-ap-footer">
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

      {/* status update 내부 유지용 (hidden) */}
      <div style={{ display: "none" }}>
        <button onClick={() => update_status("0", "PENDING")} />
      </div>
    </div>
  );
}
