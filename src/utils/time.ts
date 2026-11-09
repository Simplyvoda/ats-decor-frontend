// "Edited today", "Edited yesterday", "Edited 3 days ago", "Edited 12 Oct"
export function editedAgo(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round(
    (startOfDay(now) - startOfDay(date)) / (24 * 60 * 60 * 1000),
  );
  if (days <= 0) {
    return 'Edited today';
  }
  if (days === 1) {
    return 'Edited yesterday';
  }
  if (days < 7) {
    return `Edited ${days} days ago`;
  }
  return `Edited ${date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() === now.getFullYear() ? {} : {year: 'numeric'}),
  })}`;
}

// "1 room", "3 rooms"
export const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;
