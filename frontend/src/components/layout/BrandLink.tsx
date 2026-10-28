import { Link } from "react-router-dom";
import { ROUTES } from "../../lib/routes";
import { Brand } from "./Brand";

interface BrandLinkProps {
  // Defaults to the home page, which sends a signed-in visitor on to the
  // dashboard. The app shell passes the dashboard to skip that hop.
  to?: string;
  className?: string;
}

// The logo as a link, so every page offers a way back to the start.
export function BrandLink({ to = ROUTES.home, className }: BrandLinkProps) {
  return (
    <Link to={to} className="inline-flex shrink-0">
      <Brand className={className} />
    </Link>
  );
}
