export const generateClientShortName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return 'XX';

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const first = words[0]?.[0] ?? '';
    const second = words[1]?.[0] ?? '';
    const initials = `${first}${second}`.toUpperCase();
    return initials.length >= 2 ? initials.slice(0, 2) : `${initials}X`.slice(0, 2);
  }

  const letters = trimmed.replace(/\s+/g, '');
  if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();

  const char = letters[0]?.toUpperCase() ?? 'X';
  return `${char}X`;
};
