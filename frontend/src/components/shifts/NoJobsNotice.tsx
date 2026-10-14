import { Link } from "react-router-dom";
import { ROUTES } from "../../lib/routes";
import { Button, buttonClassName } from "../ui/Button";

interface NoJobsNoticeProps {
  onClose: () => void;
}

export function NoJobsNotice({ onClose }: NoJobsNoticeProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink">
        You need a job before you can add a shift. Add your first job, then come
        back here.
      </p>
      <div className="flex gap-3">
        <Link to={ROUTES.jobs} className={buttonClassName("primary")}>
          Go to Jobs
        </Link>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
