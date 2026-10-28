// A browser-side note that this visitor signed in before. The refresh cookie is
// HttpOnly, so the page cannot tell whether one exists. Without a hint there is
// nothing to restore, and the app skips the refresh call (which, on a sleeping
// backend, can take up to a minute). It holds no secret and grants no access:
// the server still decides whether the session is valid.
const KEY = "lt-session-hint";

// Private windows and blocked storage can throw, so every access is guarded.
export function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function saveSessionHint() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    // Without storage the visitor just signs in again next time.
  }
}

export function clearSessionHint() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
