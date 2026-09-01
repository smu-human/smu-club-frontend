// src/app/router.tsx
import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense, type ComponentType, type ReactElement } from "react";

// 공개 진입점만 즉시 로드한다. 나머지는 별도 청크로 분리해 첫 진입 번들에서 뺀다.
// 특히 등록/수정 페이지가 쓰는 Toast UI Editor는 무거운데, 정적 import 시절에는
// 동아리 상세만 보러 온 방문자도 이걸 전부 받은 뒤에야 화면이 그려졌다.
import HomePage from "../pages/home/home.tsx";
import ClubPage from "../pages/club/club.tsx";

const MyPage = lazy(() => import("../pages/mypage/mypage.tsx"));
const AccountEdit = lazy(() => import("../pages/account_edit/account_edit.tsx"));
const ClubEdit = lazy(() => import("../pages/club_edit/club_edit.tsx"));
const ClubManage = lazy(() => import("../pages/club_manage/club_manage.tsx"));
const ApplicantManage = lazy(() => import("../pages/applicant_manage/applicant_manage.tsx"));
const ApplyFormEdit = lazy(() => import("../pages/apply_form_edit/apply_form_edit.tsx"));
const ApplyForm = lazy(() => import("../pages/apply_form/apply_form.tsx"));
const ApplyFormSubmit = lazy(() => import("../pages/apply_form_submit/apply_form_submit.tsx"));
const ApplyFormChange = lazy(() => import("../pages/apply_form_change/apply_form_change.tsx"));
const AdminLoginPage = lazy(() => import("../pages/admin_login/admin_login.tsx"));
const AdminDashboard = lazy(() => import("../pages/admin_dashboard/admin_dashboard.tsx"));
const ClubRegister = lazy(() => import("../pages/club_register/club_register.tsx"));
const AdminApplyFormEdit = lazy(() => import("../pages/admin_apply_form_edit/admin_apply_form_edit.tsx"));
const ClubInfoEdit = lazy(() => import("../pages/club_info_edit/club_info_edit.tsx"));
const AdminClubInfoEdit = lazy(() => import("../pages/admin_club_info_edit/admin_club_info_edit.tsx"));
const AdminApplicantManage = lazy(() => import("../pages/admin_applicant_manage/admin_applicant_manage.tsx"));
const AdminMyPage = lazy(() => import("../pages/admin_mypage/admin_mypage.tsx"));

function lazy_route(Component: ComponentType): ReactElement {
  return (
    <Suspense fallback={<div className="route_loading">불러오는 중...</div>}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/club/:id", element: <ClubPage /> },

  { path: "/admin/login", element: lazy_route(AdminLoginPage) },
  { path: "/admin/dashboard", element: lazy_route(AdminDashboard) },
  { path: "/admin/club_register", element: lazy_route(ClubRegister) },
  { path: "/admin/apply_form_edit/:id", element: lazy_route(AdminApplyFormEdit) },
  { path: "/admin/club_info_edit/:clubId", element: lazy_route(AdminClubInfoEdit) },
  { path: "/admin/applicant_manage/:clubId", element: lazy_route(AdminApplicantManage) },
  { path: "/admin/mypage", element: lazy_route(AdminMyPage) },

  { path: "/mypage", element: lazy_route(MyPage) },
  { path: "/account_edit", element: lazy_route(AccountEdit) },

  { path: "/club_edit", element: lazy_route(ClubEdit) },
  { path: "/club_manage/:clubId", element: lazy_route(ClubManage) },
  { path: "/club_info_edit/:clubId", element: lazy_route(ClubInfoEdit) },

  { path: "/applicant_manage/:clubId", element: lazy_route(ApplicantManage) },

  { path: "/apply_form/:clubId/:clubMemberId", element: lazy_route(ApplyForm) },

  { path: "/apply_form_edit/:id", element: lazy_route(ApplyFormEdit) },
  { path: "/apply_form", element: lazy_route(ApplyForm) },
  { path: "/apply_form_submit", element: lazy_route(ApplyFormSubmit) },
  { path: "/apply_form_change/:id", element: lazy_route(ApplyFormChange) },
]);
