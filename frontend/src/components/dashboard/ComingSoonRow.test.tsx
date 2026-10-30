import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComingSoonRow } from "./ComingSoonRow";

describe("ComingSoonRow", () => {
  it("lists the planned modules under a Coming soon heading", () => {
    render(
      <ComingSoonRow
        items={[
          { icon: "activity", title: "Fitness" },
          { icon: "leaf", title: "Nutrition" },
        ]}
      />,
    );

    const section = screen.getByRole("region", { name: "Coming soon" });
    const items = within(section).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "Fitness",
      "Nutrition",
    ]);
  });

  it("is not made of links or buttons, since nothing is built yet", () => {
    render(<ComingSoonRow items={[{ icon: "wallet", title: "Finance" }]} />);

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
