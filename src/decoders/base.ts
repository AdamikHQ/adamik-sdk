import { ChainId, DecodedTransaction, RawFormat } from "../types";

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
  abstract decode(rawData: string): Promise<DecodedTransaction>;

  /**
   * Helper method to convert hex string to buffer
   */
  protected hexToBuffer(hex: string): Buffer {
    // Remove 0x prefix if present
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
    return Buffer.from(cleanHex, "hex");
  }
}
