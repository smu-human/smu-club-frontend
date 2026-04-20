// src/app/router.jsx
import { createBrowserRouter } from "react-router-dom";

import HomePage from "../pages/home/home.jsx";
import LoginPage from "../pages/login/login.jsx";
import SignupPage from "../pages/student_auth/student_auth.jsx";
import ClubPage from "../pages/club/club.jsx";
import MyPage from "../pages/mypage/mypage.jsx";
import AccountEdit from "../pages/account_edit/account_edit.jsx";
import ClubEdit from "../pages/club_edit/club_edit.jsx";
import ClubManage from "../pages/club_manage/club_manage.jsx";
import ApplicantManage from "../pages/applicant_manage/applicant_manage.jsx";
import ApplyFormEdit from "../pages/apply_form_edit/apply_form_edit.jsx";
import ApplyForm from "../pages/apply_form/apply_form.jsx";
import ApplyFormSubmit from "../pages/apply_form_submit/apply_form_submit.jsx";
import ApplyFormChange from "../pages/apply_form_change/apply_form_change.jsx";
import AdminLoginPage from "../pages/admin_login/admin_login.jsx";
import AdminDashboard from "../pages/admin_dashboard/admin_dashboard.jsx";
import ClubRegister from "../pages/club_register/club_register.jsx";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/admin/login", element: <AdminLoginPage /> },
  { path: "/admin/dashboard", element: <AdminDashboard /> },
  { path: "/admin/club_register", element: <ClubRegister /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/club/:id", element: <ClubPage /> },
  { path: "/mypage", element: <MyPage /> },
  { path: "/account_edit", element: <AccountEdit /> },

  { path: "/club_edit", element: <ClubEdit /> },
  { path: "/club_manage/:clubId", element: <ClubManage /> },

  { path: "/applicant_manage/:clubId", element: <ApplicantManage /> },

  // ✅ 운영자: 지원서 보기 (지원자 클릭 시 이동)
  { path: "/apply_form/:clubId/:clubMemberId", element: <ApplyForm /> },

  // ✅ 기존 (유지)
  { path: "/apply_form_edit/:id", element: <ApplyFormEdit /> },
  { path: "/apply_form", element: <ApplyForm /> },
  { path: "/apply_form_submit", element: <ApplyFormSubmit /> },
  { path: "/apply_form_change/:id", element: <ApplyFormChange /> },
]);
