import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it("takes its colour from the surrounding text, not a fixed white", () => {
    const { container } = render(<Spinner />);

    const spinner = container.querySelector(".animate-spin");
    expect(spinner?.className).toContain("border-current");
    expect(spinner?.className).not.toContain("border-white");
  });
});
