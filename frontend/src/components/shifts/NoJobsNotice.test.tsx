import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { NoJobsNotice } from "./NoJobsNotice";

function renderNotice(onClose = vi.fn()) {
  render(
    <MemoryRouter>
      <NoJobsNotice onClose={onClose} />
    </MemoryRouter>,
  );
  return { onClose };
}

describe("NoJobsNotice", () => {
  it("explains that a job is needed and links to the Jobs page", () => {
    renderNotice();

    expect(
      screen.getByText(/You need a job before you can add a shift/),
    ).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Go to Jobs" }).getAttribute("href"),
    ).toBe("/jobs");
  });

  it("calls onClose when Close is pressed", () => {
    const { onClose } = renderNotice();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
