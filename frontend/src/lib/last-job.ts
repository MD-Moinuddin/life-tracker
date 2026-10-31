// The job the visitor last added a shift for, so the next shift starts with it
// chosen. Stored in the browser only. Private windows and blocked storage can
// throw, so every access is guarded.
const KEY = "lt-last-job";

export function readLastJobId(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveLastJobId(jobId: string) {
  try {
    localStorage.setItem(KEY, jobId);
  } catch {
    // Without storage the next shift just starts with no job chosen.
  }
}
