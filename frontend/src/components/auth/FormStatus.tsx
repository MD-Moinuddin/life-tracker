interface FormStatusProps {
  message: string | null;
}

export function FormStatus({ message }: FormStatusProps) {
  return (
    <p
      role="alert"
      aria-live="assertive"
      className={
        message
          ? "mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          : "sr-only"
      }
    >
      {message}
    </p>
  );
}
