// src/app/router.tsx
import { createBrowserRouter } from "react-router-dom";

import HomePage from "../pages/home/home.tsx";
import LoginPage from "../pages/login/login.tsx";
import SignupPage from "../pages/student_auth/student_auth.tsx";
import ClubPage from "../pages/club/club.tsx";
import MyPage from "../pages/mypage/mypage.tsx";
import AccountEdit from "../pages/account_edit/account_edit.tsx";
import ClubEdit from "../pages/club_edit/club_edit.tsx";
import ClubManage from "../pages/club_manage/club_manage.tsx";
import ApplicantManage from "../pages/applicant_manage/applicant_manage.tsx";
import ApplyFormEdit from "../pages/apply_form_edit/apply_form_edit.tsx";
import ApplyForm from "../pages/apply_form/apply_form.tsx";
import ApplyFormSubmit from "../pages/apply_form_submit/apply_form_submit.tsx";
import ApplyFormChange from "../pages/apply_form_change/apply_form_change.tsx";
import AdminLoginPage from "../pages/admin_login/admin_login.tsx";
import AdminDashboard from "../pages/admin_dashboard/admin_dashboard.tsx";
import ClubRegister from "../pages/club_register/club_register.tsx";
import AdminApplyFormEdit from "../pages/admin_apply_form_edit/admin_apply_form_edit.tsx";
import ClubInfoEdit from "../pages/club_info_edit/club_info_edit.tsx";
import AdminClubInfoEdit from "../pages/admin_club_info_edit/admin_club_info_edit.tsx";
import AdminApplicantManage from "../pages/admin_applicant_manage/admin_applicant_manage.tsx";
import AdminMyPage from "../pages/admin_mypage/admin_mypage.tsx";
import DevNav from "../pages/dev_nav/dev_nav.tsx";

export const router = createBrowserRouter([
  { path: "/dev", element: <DevNav /> },
  { path: "/", element: <HomePage /> },
  { path: "/admin/login", element: <AdminLoginPage /> },
  { path: "/admin/dashboard", element: <AdminDashboard /> },
  { path: "/admin/club_register", element: <ClubRegister /> },
  { path: "/admin/apply_form_edit/:id", element: <AdminApplyFormEdit /> },
  { path: "/admin/club_info_edit/:clubId", element: <AdminClubInfoEdit /> },
  { path: "/admin/applicant_manage/:clubId", element: <AdminApplicantManage /> },
  { path: "/admin/mypage", element: <AdminMyPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/club/:id", element: <ClubPage /> },
  { path: "/mypage", element: <MyPage /> },
  { path: "/account_edit", element: <AccountEdit /> },

  { path: "/club_edit", element: <ClubEdit /> },
  { path: "/club_manage/:clubId", element: <ClubManage /> },
  { path: "/club_info_edit/:clubId", element: <ClubInfoEdit /> },

  { path: "/applicant_manage/:clubId", element: <ApplicantManage /> },

  { path: "/apply_form/:clubId/:clubMemberId", element: <ApplyForm /> },

  { path: "/apply_form_edit/:id", element: <ApplyFormEdit /> },
  { path: "/apply_form", element: <ApplyForm /> },
  { path: "/apply_form_submit", element: <ApplyFormSubmit /> },
  { path: "/apply_form_change/:id", element: <ApplyFormChange /> },
]);
