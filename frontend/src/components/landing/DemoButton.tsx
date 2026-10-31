import { useStartDemo } from "../../hooks/useStartDemo";
import { Button } from "../ui/Button";
import { LANDING_CTA } from "./landing-content";

// Opens the app with made-up data. Nothing is created on the server, so it
// opens at once, even while the server is asleep.
export function DemoButton() {
  const startDemo = useStartDemo();

  return (
    <Button variant="ghost" className="px-6 text-base" onClick={startDemo}>
      {LANDING_CTA.demo}
    </Button>
  );
}
