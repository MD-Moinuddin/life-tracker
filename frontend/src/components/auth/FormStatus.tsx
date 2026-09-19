interface FormStatusProps {
  message: string | null;
}

export function FormStatus({ message }: FormStatusProps) {
  return (
    <p role="alert" aria-live="assertive">
      {message}
    </p>
  );
}
