import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadBoundary, LoadMessage } from "./LoadBoundary";

describe("LoadMessage", () => {
  it("says what is loading", () => {
    render(<LoadMessage status="loading" noun="your jobs" />);

    expect(screen.getByText("Loading your jobs…")).toBeDefined();
  });

  it("announces the error and tells the user how to retry", () => {
    render(<LoadMessage status="error" noun="your jobs" />);

    expect(screen.getByRole("alert").textContent).toBe(
      "Could not load your jobs. Refresh the page to try again.",
    );
  });

  it("accepts a different retry hint", () => {
    render(
      <LoadMessage
        status="error"
        noun="your jobs"
        retryHint="Close this dialog and try again."
      />,
    );

    expect(screen.getByRole("alert").textContent).toBe(
      "Could not load your jobs. Close this dialog and try again.",
    );
  });
});

describe("LoadBoundary", () => {
  it("shows the loading message", () => {
    render(
      <LoadBoundary state={{ status: "loading" }} noun="your jobs">
        {() => <p>data</p>}
      </LoadBoundary>,
    );

    expect(screen.getByText("Loading your jobs…")).toBeDefined();
    expect(screen.queryByText("data")).toBeNull();
  });

  it("shows the error message", () => {
    render(
      <LoadBoundary state={{ status: "error" }} noun="your jobs">
        {() => <p>data</p>}
      </LoadBoundary>,
    );

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.queryByText("data")).toBeNull();
  });

  it("renders the children with the data once ready", () => {
    render(
      <LoadBoundary
        state={{ status: "ready", data: ["a", "b"] }}
        noun="your jobs"
      >
        {(items) => <p>{items.join(",")}</p>}
      </LoadBoundary>,
    );

    expect(screen.getByText("a,b")).toBeDefined();
  });
});
