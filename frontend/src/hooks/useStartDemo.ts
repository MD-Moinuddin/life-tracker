import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { localNow } from "../lib/dates";
import { startDemoSession } from "../lib/demo/demo-session";
import { ROUTES } from "../lib/routes";

// Opens the app with made-up data around the visitor's today. Nothing is
// created on the server, so it opens at once.
export function useStartDemo() {
  const navigate = useNavigate();

  return useCallback(() => {
    startDemoSession(localNow().slice(0, 10));
    navigate(ROUTES.dashboard);
  }, [navigate]);
}
