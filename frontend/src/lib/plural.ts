// "1 shift", "3 shifts": a count with its noun, for plain English nouns.
export function pluralize(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}
