import { render, screen } from "@testing-library/react";
import { MemoryRouter, Link } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Card, cardClassName } from "./Card";

describe("Card", () => {
  it("renders its children in a bordered surface", () => {
    render(<Card>Hello</Card>);

    const card = screen.getByText("Hello");
    expect(card.className).toContain("bg-surface");
    expect(card.className).toContain("border-border");
    expect(card.className).toContain("rounded-card");
  });

  it("has no hover style when plain", () => {
    render(<Card>Plain</Card>);

    expect(screen.getByText("Plain").className).not.toContain("hover:");
  });

  it("has a hover style when interactive", () => {
    render(<Card variant="interactive">Link</Card>);

    expect(screen.getByText("Link").className).toContain("hover:border-accent");
  });

  it("merges extra classes and passes other props through", () => {
    render(
      <Card className="p-4" data-testid="card">
        x
      </Card>,
    );

    const card = screen.getByTestId("card");
    expect(card.className).toContain("p-4");
    expect(card.className).toContain("bg-surface");
  });
});

describe("cardClassName", () => {
  it("styles a link as an interactive card", () => {
    render(
      <MemoryRouter>
        <Link to="/shifts" className={cardClassName("interactive", "p-4")}>
          Work Schedule
        </Link>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "Work Schedule" });
    expect(link.className).toContain("hover:border-accent");
    expect(link.className).toContain("p-4");
  });
});
