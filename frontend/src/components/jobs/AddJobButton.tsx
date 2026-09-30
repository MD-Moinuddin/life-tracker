import { PRIMARY_BUTTON_CLASSES } from "../form/form-styles";

interface AddJobButtonProps {
  onClick: () => void;
}

export function AddJobButton({ onClick }: AddJobButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${PRIMARY_BUTTON_CLASSES} shadow-sm`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1z" />
      </svg>
      Add job
    </button>
  );
}
