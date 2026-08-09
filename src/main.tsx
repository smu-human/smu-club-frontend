// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router.tsx";
import { on_session_expired, clear_tokens } from "./lib/api";

let unsub: (() => void) | null = null;

function setup_session_expired_listener(): void {
  if (unsub) return;

  unsub = on_session_expired(() => {
    clear_tokens();

    try {
      router.navigate("/");
    } catch {
      window.location.href = "/";
    }
  });
}

setup_session_expired_listener();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
