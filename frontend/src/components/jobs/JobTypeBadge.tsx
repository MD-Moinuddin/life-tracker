import type { JobType } from "../../lib/jobs-api";
import { Badge } from "../ui/Badge";
import { JOB_TYPE_LABELS, JOB_TYPE_TONES } from "./job-types";

// The one place a job's type is drawn, so every page shows it the same way.
export function JobTypeBadge({ type }: { type: JobType }) {
  return <Badge tone={JOB_TYPE_TONES[type]}>{JOB_TYPE_LABELS[type]}</Badge>;
}
