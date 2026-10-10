import type { JobType } from "../../lib/jobs-api";
import type { BadgeTone } from "../ui/Badge";

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  part_time: "Part-time job",
  mini_job: "Mini-job",
};

export const JOB_TYPE_TONES: Record<JobType, BadgeTone> = {
  part_time: "success",
  mini_job: "accent",
};
