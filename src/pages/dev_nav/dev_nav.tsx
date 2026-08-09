import { Link } from "react-router-dom";

const routes = [
  { label: "Home", path: "/" },
  { label: "Club (id=1)", path: "/club/1" },
  { label: "MyPage", path: "/mypage" },
  { label: "Account Edit", path: "/account_edit" },
  { label: "Club Edit", path: "/club_edit" },
  { label: "Club Manage (clubId=1)", path: "/club_manage/1" },
  { label: "Club Info Edit (clubId=1)", path: "/club_info_edit/1" },
  { label: "Applicant Manage (clubId=1)", path: "/applicant_manage/1" },
  { label: "Apply Form (clubId=1, memberId=1)", path: "/apply_form/1/1" },
  { label: "Apply Form (no params)", path: "/apply_form" },
  { label: "Apply Form Edit (id=1)", path: "/apply_form_edit/1" },
  { label: "Apply Form Submit", path: "/apply_form_submit" },
  { label: "Apply Form Change (id=1)", path: "/apply_form_change/1" },
  { label: "Admin Login", path: "/admin/login" },
  { label: "Admin Dashboard", path: "/admin/dashboard" },
  { label: "Admin Club Register", path: "/admin/club_register" },
  { label: "Admin Apply Form Edit (id=1)", path: "/admin/apply_form_edit/1" },
  { label: "Admin Club Info Edit (clubId=1)", path: "/admin/club_info_edit/1" },
  { label: "Admin Applicant Manage (clubId=1)", path: "/admin/applicant_manage/1" },
];

export default function DevNav() {
  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "16px" }}>
        [DEV] 페이지 목록 (임시)
      </h1>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
        {routes.map(({ label, path }) => (
          <li key={path}>
            <Link
              to={path}
              style={{
                display: "block",
                padding: "10px 16px",
                background: "#f5f5f5",
                borderRadius: "6px",
                textDecoration: "none",
                color: "#1a1a1a",
                fontSize: "14px",
              }}
            >
              <span style={{ fontWeight: "bold" }}>{label}</span>
              <span style={{ marginLeft: "12px", color: "#888", fontSize: "12px" }}>{path}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
