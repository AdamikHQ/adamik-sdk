import { ChainId, RawFormat } from "../types";

export abstract class BaseDecoder {
  constructor(
    public readonly chainId: ChainId,
    public readonly format: RawFormat
  ) {}

  /**
   * Decodes the raw transaction data
   * @param rawData The encoded transaction data as a hex string
   * @returns The decoded transaction object
   */
  abstract decode(rawData: string): Promise<unknown>;

  /**
   * Validates the decoded data matches expected structure
   * @param decodedData The decoded transaction data
   * @returns true if valid, false otherwise
   */
  abstract validate(decodedData: unknown): boolean;

  /**
   * Helper method to convert hex string to buffer
   */
  protected hexToBuffer(hex: string): Buffer {
    // Remove 0x prefix if present
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
    return Buffer.from(cleanHex, "hex");
  }

  /**
   * Helper method to convert buffer to hex string
   */
  protected bufferToHex(buffer: Buffer): string {
    return "0x" + buffer.toString("hex");
  }
}
