export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function generateRange(min: number, max: number, step: number): number[] {
  const result: number[] = [];
  for (let v = min; v <= max; v = Math.round((v + step) * 10) / 10)
    result.push(v);
  return result;
}
