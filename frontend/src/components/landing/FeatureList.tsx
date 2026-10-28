import { Card } from "../ui/Card";
import { LANDING_FEATURES } from "./landing-content";

export function FeatureList() {
  return (
    <ul className="grid gap-4 lg:grid-cols-3">
      {LANDING_FEATURES.map((feature) => (
        <li key={feature.title}>
          <Card padded className="h-full">
            <h2 className="font-semibold text-ink">{feature.title}</h2>
            <p className="mt-1 text-sm text-ink-muted">{feature.description}</p>
          </Card>
        </li>
      ))}
    </ul>
  );
}
