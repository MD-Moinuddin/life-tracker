import { Button } from "./ui/Button";
import { Icon } from "./ui/Icon";

interface AddButtonProps {
  label: string;
  onClick: () => void;
  // On a phone, float at the bottom right within thumb reach, above the
  // bottom navigation bar. The page leaves room at its bottom so the button
  // never hides the last item.
  floating?: boolean;
}

const FLOATING =
  "max-sm:fixed max-sm:right-4 max-sm:bottom-[calc(var(--spacing-tabbar)+1rem)] max-sm:z-10 max-sm:min-h-13 max-sm:rounded-full max-sm:pr-5 max-sm:pl-4 max-sm:shadow-lg";

export function AddButton({
  label,
  onClick,
  floating = false,
}: AddButtonProps) {
  return (
    <Button onClick={onClick} className={floating ? FLOATING : undefined}>
      <Icon name="plus" className="h-4 w-4" />
      {label}
    </Button>
  );
}
