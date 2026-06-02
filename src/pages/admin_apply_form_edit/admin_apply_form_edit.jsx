// src/pages/admin_apply_form_edit/admin_apply_form_edit.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/globals.css";
import "./admin_apply_form_edit.css";
import { fetch_owner_club_questions, owner_update_club_questions } from "../../lib/api";

function normalize_content(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function AdminApplyFormEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [questions, setQuestions] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error_msg, set_error_msg] = useState("");

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    fetch_owner_club_questions(id)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setQuestions(
          list
            .map((q) => ({
              questionId: q.questionId ?? q.id ?? `q-${Math.random()}`,
              orderNum: q.orderNum ?? 0,
              content: q.content ?? "",
              type: "text",
            }))
            .sort((a, b) => a.orderNum - b.orderNum),
        );
      })
      .catch((e) => set_error_msg(e?.message || "질문을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  const addQuestion = () => {
    const content = normalize_content(newQuestion);
    if (!content) return;

    setQuestions((prev) => {
      const merged = [
        ...(prev || []),
        {
          questionId: `local-${crypto.randomUUID()}`,
          orderNum: prev?.length ?? 0,
          content,
          type: "text",
        },
      ];
      const out = [];
      const seen = new Set();
      for (const q of merged) {
        const c = normalize_content(q.content);
        if (!c) continue;
        const key = c.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ ...q, content: c });
      }
      return out.map((q, idx) => ({ ...q, orderNum: idx }));
    });

    setNewQuestion("");
    setAdding(false);
  };

  const removeQuestion = (qid) => {
    setQuestions((prev) =>
      (prev || [])
        .filter((q) => String(q.questionId) !== String(qid))
        .map((q, idx) => ({ ...q, orderNum: idx })),
    );
  };

  const updateQuestionContent = (qid, content) => {
    setQuestions((prev) =>
      (prev || [])
        .map((q) =>
          String(q.questionId) === String(qid) ? { ...q, content } : q,
        )
        .map((q, idx) => ({ ...q, orderNum: idx })),
    );
  };

  const onSave = async () => {
    if (!id || saving) return;
    setSaving(true);
    try {
      const payload = questions.map((q, idx) => ({
        questionId: typeof q.questionId === "string" && q.questionId.startsWith("local-")
          ? undefined
          : Number(q.questionId) || undefined,
        content: normalize_content(q.content),
        orderNum: idx,
        isRequired: true,
      }));
      await owner_update_club_questions(id, payload);
      alert("저장되었습니다.");
    } catch (e) {
      alert(e?.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const sorted_questions = [...questions].sort(
    (a, b) => (a.orderNum ?? 0) - (b.orderNum ?? 0),
  );

  return (
    <div className="page-root afe_page">
      <div className="page-header sticky-header safe-area-top">
        <div className="container">
          <div className="page-header-content">
            <button
              type="button"
              className="back-btn"
              aria-label="뒤로가기"
              onClick={() => navigate("/admin/dashboard")}
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
            <h1>지원서 양식 수정</h1>
          </div>
        </div>
      </div>

      <main className="page-main afe_main">
        <div className="afe_grid">
          {/* 좌측: 질문 관리 */}
          <section className="afe_section">
            <h2 className="afe_title">질문 관리</h2>
            <div className="afe_card">
              {error_msg && <p className="afe_error">{error_msg}</p>}
              {loading && <p className="afe_desc">불러오는 중...</p>}
              <p className="afe_desc">
                지원자에게 보여줄 질문을 추가·수정·삭제하세요.
              </p>

              {sorted_questions.length > 0 && (
                <div className="afe_q_list">
                  {sorted_questions.map((q, idx) => (
                    <div key={q.questionId} className="afe_q_item">
                      <label className="afe_field_label">{idx + 1}. 질문</label>
                      <textarea
                        className="afe_answer_area"
                        placeholder="질문 내용을 입력하세요"
                        value={q.content ?? ""}
                        onChange={(e) =>
                          updateQuestionContent(q.questionId, e.target.value)
                        }
                      />
                      <button
                        type="button"
                        className="afe_q_remove_btn"
                        onClick={() => removeQuestion(q.questionId)}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!adding ? (
                <button
                  type="button"
                  className="afe_add_btn"
                  onClick={() => setAdding(true)}
                >
                  + 질문 추가
                </button>
              ) : (
                <div className="afe_add_row">
                  <input
                    className="afe_field_input"
                    placeholder="추가할 질문 내용을 입력하세요"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addQuestion()}
                  />
                  <div className="afe_add_actions">
                    <button
                      type="button"
                      className="afe_outline_btn"
                      onClick={() => {
                        setAdding(false);
                        setNewQuestion("");
                      }}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="afe_outline_btn"
                      onClick={addQuestion}
                    >
                      추가
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 우측: 지원서 미리보기 */}
          <section className="afe_section">
            <h2 className="afe_title">지원서 미리보기 (유저 화면)</h2>
            <div className="afe_card afe_preview_card">
              <p className="afe_desc">
                실제 지원자에게 보이는 화면입니다. 기본 정보는 자동으로
                채워집니다.
              </p>

              <div className="afe_preview_group">
                <span className="afe_preview_label">학과</span>
                <div className="afe_preview_input afe_preview_locked">
                  스뮤클럽과
                </div>
              </div>

              <div className="afe_preview_group">
                <span className="afe_preview_label">학번</span>
                <div className="afe_preview_input afe_preview_locked">
                  20241234
                </div>
              </div>

              <div className="afe_preview_group">
                <span className="afe_preview_label">이름</span>
                <div className="afe_preview_input afe_preview_locked">
                  홍길동
                </div>
              </div>

              <div className="afe_preview_group">
                <span className="afe_preview_label">전화번호</span>
                <div className="afe_preview_input afe_preview_locked">
                  01012345678
                </div>
              </div>

              {sorted_questions.length > 0 && (
                <div className="afe_preview_q_list">
                  {sorted_questions.map((q, idx) => (
                    <div key={q.questionId} className="afe_preview_group">
                      <span className="afe_preview_label">
                        {idx + 1}. {q.content || "질문 내용을 입력하세요"}
                      </span>
                      <div className="afe_preview_textarea">
                        답변을 입력하세요
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {sorted_questions.length === 0 && (
                <p
                  className="afe_desc"
                  style={{ textAlign: "center", marginTop: 12 }}
                >
                  추가된 질문이 없습니다.
                </p>
              )}

              <button type="button" className="afe_preview_submit_btn" disabled>
                제출하기
              </button>
            </div>
          </section>
        </div>

        <button className="afe_save_btn" onClick={onSave} disabled={saving}>
          {saving ? "저장 중..." : "저장하기"}
        </button>
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
