// src/pages/apply_form_submit/apply_form_submit.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "../../styles/globals.css";
import "./apply_form_submit.css";
import {
  fetch_public_application_form,
  submit_public_application,
} from "../../lib/api";

export default function ApplyFormSubmit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const club_id = useMemo(() => {
    const from_state =
      location?.state?.clubId ??
      location?.state?.club?.id ??
      location?.state?.club?.clubId;
    const v = from_state ?? id ?? "";
    return v === undefined || v === null ? "" : String(v);
  }, [location, id]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error_msg, set_error_msg] = useState("");

  const [custom_questions, set_custom_questions] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [studentId, setStudentId] = useState("");
  const [major, setMajor] = useState("");

  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const load = async () => {
      if (!club_id) {
        set_error_msg("club id가 없습니다.");
        setLoading(false);
        return;
      }

      setLoading(true);
      set_error_msg("");

      try {
        const questions = await fetch_public_application_form(club_id);

        const mapped = questions
          .map((q) => ({
            questionId: q.questionId,
            orderNum: typeof q.orderNum === "number" ? q.orderNum : 0,
            questionContent: q.content ?? "",
          }))
          .filter((q) => q.questionContent.length > 0)
          .sort((a, b) => a.orderNum - b.orderNum);

        set_custom_questions(mapped);

        setAnswers(() => {
          const next = {};
          for (const q of mapped) {
            next[String(q.questionId)] = "";
          }
          return next;
        });
      } catch (e) {
        set_error_msg(e?.message || "지원서 정보를 불러오지 못했습니다.");
        set_custom_questions([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [club_id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!club_id || submitting) return;

    setSubmitting(true);
    set_error_msg("");

    try {
      const payload = {
        applicantInfo: {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          studentId: studentId.trim(),
          major: major.trim(),
        },
        answers: custom_questions.map((q) => ({
          questionId: Number(q.questionId),
          answer: String(answers[String(q.questionId)] ?? "").trim(),
        })),
      };

      await submit_public_application(club_id, payload);

      alert("지원서가 제출되었습니다.");
      navigate(club_id ? `/club/${club_id}` : "/");
    } catch (err) {
      set_error_msg(err?.message || "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-root">
      <div className="page-header sticky-header safe-area-top">
        <div className="container">
          <div className="page-header-content">
            <button
              type="button"
              className="back-btn"
              aria-label="뒤로가기"
              onClick={() => navigate(club_id ? `/club/${club_id}` : "/")}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1>지원서 작성</h1>
          </div>
        </div>
      </div>

      <main className="page-main apply_submit_main">
        <section className="apply_submit_section">
          <h2 className="apply_submit_title">온라인 지원</h2>

          <form className="apply_submit_card" onSubmit={onSubmit}>
            {error_msg && <p className="mypage_error">{error_msg}</p>}

            {loading ? (
              <p className="desc">불러오는 중...</p>
            ) : (
              <>
                <p className="desc">필수 항목을 정확히 입력한 뒤 제출하세요.</p>

                <label className="field_label" htmlFor="uname">이름</label>
                <input
                  id="uname"
                  className="field_input"
                  placeholder="이름을 입력하세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <label className="field_label" htmlFor="email">이메일</label>
                <input
                  id="email"
                  className="field_input"
                  type="email"
                  placeholder="example@sangmyung.kr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <label className="field_label" htmlFor="phone">전화번호</label>
                <input
                  id="phone"
                  className="field_input"
                  placeholder="01012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />

                <label className="field_label" htmlFor="sid">학번</label>
                <input
                  id="sid"
                  className="field_input"
                  placeholder="학번을 입력하세요 (예: 202012345)"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />

                <label className="field_label" htmlFor="major">학과</label>
                <input
                  id="major"
                  className="field_input"
                  placeholder="소속 학과를 입력하세요"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  required
                />

                {custom_questions.length > 0 && (
                  <div className="custom_list">
                    {custom_questions.map((q, i) => (
                      <div key={String(q.questionId)} className="q_block">
                        <label className="field_label">
                          {i + 1}. {q.questionContent}
                        </label>
                        <textarea
                          className="answer_area"
                          placeholder="답변을 입력하세요"
                          value={answers[String(q.questionId)] ?? ""}
                          onChange={(e) =>
                            setAnswers((prev) => ({
                              ...(prev || {}),
                              [String(q.questionId)]: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  className="primary_btn submit_btn"
                  disabled={submitting}
                >
                  {submitting ? "제출중..." : "제출하기"}
                </button>
              </>
            )}
          </form>
        </section>
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
