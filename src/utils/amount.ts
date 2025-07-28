/**
 * Parse amount from various formats to BigInt
 * 
 * @param amount - The amount value in various formats (string, bigint, etc.)
 * @returns The amount as a bigint, or 0n if invalid
 */
export function parseAmount(amount: unknown): bigint {
  if (typeof amount === "bigint") {
    return amount;
  }
  if (typeof amount === "string") {
    return BigInt(amount);
  }
  return 0n;
}