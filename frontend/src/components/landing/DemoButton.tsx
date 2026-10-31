import { useNavigate } from "react-router-dom";
import { localNow } from "../../lib/dates";
import { startDemoSession } from "../../lib/demo/demo-session";
import { ROUTES } from "../../lib/routes";
import { Button } from "../ui/Button";
import { LANDING_CTA } from "./landing-content";

// Opens the app with made-up data. Nothing is created on the server, so it
// opens at once, even while the server is asleep.
export function DemoButton() {
  const navigate = useNavigate();

  function handleClick() {
    startDemoSession(localNow().slice(0, 10));
    navigate(ROUTES.dashboard);
  }

  return (
    <Button variant="ghost" className="px-6 text-base" onClick={handleClick}>
      {LANDING_CTA.demo}
    </Button>
  );
}
