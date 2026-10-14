import { Button } from "./ui/Button";
import { Icon } from "./ui/Icon";

interface AddButtonProps {
  label: string;
  onClick: () => void;
}

export function AddButton({ label, onClick }: AddButtonProps) {
  return (
    <Button onClick={onClick}>
      <Icon name="plus" className="h-4 w-4" />
      {label}
    </Button>
  );
}
