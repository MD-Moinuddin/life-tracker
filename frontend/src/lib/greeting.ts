// "Good evening, Md": the time-of-day greeting for the Dashboard. `now` is the
// browser's wall-clock time as YYYY-MM-DDTHH:mm.
export function greeting(now: string, name?: string): string {
  const hour = Number(now.slice(11, 13));
  const part =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = name?.trim().split(/\s+/)[0];
  return firstName ? `${part}, ${firstName}` : part;
}
