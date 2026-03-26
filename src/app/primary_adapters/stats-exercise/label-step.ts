export function getLabelStep(n: number): number {
  if (n > 500) return 100;
  if (n > 200) return 40;
  if (n > 100) return 20;
  if (n > 30)  return 10;
  if (n > 20)  return 5;
  if (n > 10)  return 2;
  return 1;
}
