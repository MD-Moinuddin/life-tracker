import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { MemoryRouter, Link } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Alert } from "./Alert";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Card, cardClassName } from "./Card";
import { EmptyState } from "./EmptyState";
import { Field } from "./Field";
import { Input } from "./Input";
import { PageHeader } from "./PageHeader";
import { PasswordInput } from "./PasswordInput";
import { Select } from "./Select";
import { Cell, HeaderCell, RowHeader, Table } from "./Table";

describe("shared UI components", () => {
  it("have no accessibility violations when used together", async () => {
    const { container } = render(
      <MemoryRouter>
        <main>
          <PageHeader
            title="Summary"
            subtitle="Your hours and earnings"
            action={<Button>Add shift</Button>}
          />
          <Alert tone="warning" title="Mini-job warning." role="status">
            Planned mini-job earnings are over the threshold.
          </Alert>
          <Alert tone="danger" role="alert">
            Could not save.
          </Alert>
          <Alert tone="info">You can keep logging shifts.</Alert>
          <form>
            <Field
              label="Name"
              hint="As on your contract"
              errors={["Required"]}
            >
              {(control) => <Input {...control} />}
            </Field>
            <Field label="Job">
              {(control) => (
                <Select {...control}>
                  <option value="a">Warehouse</option>
                </Select>
              )}
            </Field>
            <Field label="Password">
              {(control) => <PasswordInput {...control} />}
            </Field>
            <Button type="submit" variant="secondary">
              Save
            </Button>
            <Button variant="danger" size="compact" loading>
              Deleting…
            </Button>
          </form>
          <Card>
            <Badge tone="accent">Mini-job</Badge>
            <Badge tone="success">Part-time</Badge>
            <Badge>Coming later</Badge>
          </Card>
          <Link
            to="/shifts"
            className={cardClassName("interactive", "block p-4")}
          >
            Work Schedule
          </Link>
          <EmptyState
            icon="calendar"
            title="No shifts"
            action={<Button>Add shift</Button>}
          >
            Add a shift to see it here.
          </EmptyState>
          <Table caption="Hours and earnings per job">
            <thead>
              <tr>
                <HeaderCell>Job</HeaderCell>
                <HeaderCell align="right">Earned</HeaderCell>
              </tr>
            </thead>
            <tbody>
              <tr>
                <RowHeader>Warehouse</RowHeader>
                <Cell align="right">€96.00</Cell>
              </tr>
            </tbody>
          </Table>
        </main>
      </MemoryRouter>,
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
