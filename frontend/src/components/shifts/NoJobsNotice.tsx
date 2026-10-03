import { Link } from "react-router-dom";
import {
  PRIMARY_BUTTON_CLASSES,
  SECONDARY_BUTTON_CLASSES,
} from "../form/form-styles";

interface NoJobsNoticeProps {
  onClose: () => void;
}

export function NoJobsNotice({ onClose }: NoJobsNoticeProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-700">
        You need a job before you can add a shift. Add your first job, then come
        back here.
      </p>
      <div className="flex gap-3">
        <Link to="/jobs" className={PRIMARY_BUTTON_CLASSES}>
          Go to Jobs
        </Link>
        <button
          type="button"
          onClick={onClose}
          className={SECONDARY_BUTTON_CLASSES}
        >
          Close
        </button>
      </div>
    </div>
  );
}
