import type { ApplicationResult } from "../lib/types";
import "./result.css";

interface Props {
  open: boolean;
  loading: boolean;
  error: string;
  result: ApplicationResult | null;
  onClose: () => void;
}

export default function ApplicationResultModal({ open, loading, error, result, onClose }: Props) {
  if (!open) return null;

  const status = (result?.status || "").toUpperCase();

  const label =
    status === "ACCEPTED"
      ? "합격 🎉"
      : status === "REJECTED"
      ? "불합격"
      : status
      ? "대기중"
      : "-";

  return (
    <div className="modal_overlay">
      <div className="modal_card">
        <h3>지원 결과</h3>

        {loading ? (
          <p>불러오는 중...</p>
        ) : error ? (
          <p className="error_text">{error}</p>
        ) : (
          <>
            <p className="modal_club">{result?.clubName}</p>
            <p className={`modal_result status_${status.toLowerCase()}`}>
              {label}
            </p>
          </>
        )}

        <button className="btn btn-secondary" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
