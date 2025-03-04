// app/components/Portal.jsx
"use client";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom";

/**
 * Portal: children을 #portal-root (DOM)로 렌더링
 */
export default function Portal({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 클라이언트에서만 DOM 접근
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const portalRoot = document.getElementById("portal-root");
  if (!portalRoot) return null;

  return ReactDOM.createPortal(children, portalRoot);
}