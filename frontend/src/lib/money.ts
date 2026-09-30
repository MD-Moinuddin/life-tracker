const euroFormat = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
});

export function formatEuro(amount: string): string {
  return euroFormat.format(Number(amount));
}

export function parseEuroInput(input: string): string | null {
  const trimmed = input.trim();
  if (!/^\d{1,6}([.,]\d{1,2})?$/.test(trimmed)) {
    return null;
  }
  return trimmed.replace(",", ".");
}
