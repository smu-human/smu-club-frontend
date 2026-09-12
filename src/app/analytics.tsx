// src/app/analytics.tsx
import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { router } from "./router.tsx";

// 동적 세그먼트를 가진 경로(/club/:id 등)를 실제 URL 그대로 보내면 동아리 수만큼
// 별개 페이지로 쌓인다. 매칭된 라우트 패턴을 route로, 실제 경로를 path로 넘겨
// "/club/:id" 한 줄로 집계되게 한다.
//
// route를 넘기면 @vercel/analytics의 자동 추적이 꺼지고(disableAutoTrack),
// route와 path가 모두 채워졌을 때만 pageview가 전송된다. 매칭 실패 시에도
// 집계가 사라지지 않도록 pathname을 폴백으로 쓴다.

type RouteInfo = { route: string; path: string };

function read_route_info(): RouteInfo {
  const { matches, location } = router.state;
  const matched = [...matches].reverse().find((m) => m.route.path);

  return {
    route: matched?.route.path ?? location.pathname,
    path: location.pathname,
  };
}

// RouterProvider 바깥에서 렌더되므로 useMatches 같은 훅 대신 router를 직접 구독한다.
// 라우트 배열 구조를 건드리지 않아도 되는 대신, 구독 해제를 직접 관리한다.
export function RouteAwareAnalytics() {
  const [info, set_info] = useState<RouteInfo>(read_route_info);

  useEffect(() => router.subscribe(() => set_info(read_route_info())), []);

  return <Analytics route={info.route} path={info.path} />;
}
