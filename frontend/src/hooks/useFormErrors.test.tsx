import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFormErrors } from "./useFormErrors";

type Name = "email" | "password";
const ORDER: readonly Name[] = ["email", "password"];
const ERRORS = { email: ["Bad email"], password: [] as string[] };

function formWith(...names: Name[]) {
  const form = document.createElement("form");
  for (const name of names) {
    const input = document.createElement("input");
    input.name = name;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  return form;
}

describe("useFormErrors", () => {
  it("shows nothing before the visitor has done anything", () => {
    const { result } = renderHook(() => useFormErrors(ERRORS, ORDER));

    expect(result.current.errorsFor("email")).toEqual([]);
    expect(result.current.isShown("email")).toBe(false);
  });

  it("does not count leaving an empty field", () => {
    const { result } = renderHook(() => useFormErrors(ERRORS, ORDER));

    act(() => result.current.onBlur("email", ""));

    expect(result.current.errorsFor("email")).toEqual([]);
  });

  it("shows a field's errors once it has been typed in and left", () => {
    const { result } = renderHook(() => useFormErrors(ERRORS, ORDER));

    act(() => result.current.onBlur("email", "md@"));

    expect(result.current.errorsFor("email")).toEqual(["Bad email"]);
    expect(result.current.errorsFor("password")).toEqual([]);
  });

  it("follows the errors it is given, so a fixed field stops showing one", () => {
    const { result, rerender } = renderHook(
      ({ errors }) => useFormErrors(errors, ORDER),
      { initialProps: { errors: ERRORS } },
    );
    act(() => result.current.onBlur("email", "md@"));

    rerender({ errors: { email: [], password: [] } });

    expect(result.current.errorsFor("email")).toEqual([]);
  });

  it("on submit shows every error and focuses the first field with one", () => {
    const form = formWith("email", "password");
    const { result } = renderHook(() =>
      useFormErrors({ email: [], password: ["Needs a password"] }, ORDER),
    );

    let ok = true;
    act(() => {
      ok = result.current.check(form);
    });

    expect(ok).toBe(false);
    expect(result.current.errorsFor("password")).toEqual(["Needs a password"]);
    expect(document.activeElement).toBe(form.elements.namedItem("password"));
    form.remove();
  });

  it("lets a valid form go ahead without moving focus", () => {
    const form = formWith("email");
    const { result } = renderHook(() =>
      useFormErrors({ email: [], password: [] }, ORDER),
    );

    let ok = false;
    act(() => {
      ok = result.current.check(form);
    });

    expect(ok).toBe(true);
    expect(document.activeElement).toBe(document.body);
    form.remove();
  });
});
