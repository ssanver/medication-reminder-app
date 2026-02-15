export function toShortDisplayName(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return '';
  }

  if (parts.length === 1) {
    return parts[0];
  }

  const initial = `${parts[1].slice(0, 1).toLocaleUpperCase('tr-TR')}.`;
  return `${parts[0]} ${initial}`;
}
