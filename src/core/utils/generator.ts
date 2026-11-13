export function generateRandomDataset(size: number = 14, min: number = 10, max: number = 99): number[] {
  const result: number[] = [];
  for (let i = 0; i < size; i++) {
    result.push(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return result;
}

export function parseCustomDataset(input: string): number[] | null {
  const cleaned = input.trim();
  if (!cleaned) return null;

  const parts = cleaned.split(/[\s,]+/);
  const numbers: number[] = [];

  for (const part of parts) {
    if (!part) continue;
    const num = Number(part);
    if (isNaN(num) || !Number.isInteger(num) || num < 1 || num > 999) {
      return null;
    }
    numbers.push(num);
  }

  if (numbers.length < 3 || numbers.length > 30) {
    return null;
  }

  return numbers;
}
