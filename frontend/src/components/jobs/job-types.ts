import type { JobType } from "../../lib/jobs-api";
import type { BadgeTone } from "../ui/Badge";

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  part_time: "Part-time job",
  mini_job: "Mini-job",
};

export const JOB_TYPE_TONES: Record<JobType, BadgeTone> = {
  part_time: "neutral",
  mini_job: "accent",
};

// One line under each type where a visitor chooses between them.
export const JOB_TYPE_DESCRIPTIONS: Record<JobType, string> = {
  part_time: "A regular job with its own hours.",
  mini_job:
    "Counts towards the monthly earnings limit, with a warning before you pass it.",
};
