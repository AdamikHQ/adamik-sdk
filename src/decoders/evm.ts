import { BaseDecoder } from "./base";
import { ChainId, TransactionMode, DecodedTransaction } from "../types";
import { isAddress, isHex, parseTransaction, getAddress } from "viem";

export class EVMDecoder extends BaseDecoder {
  constructor(chainId: ChainId) {
    super(chainId, "RLP");
  }

  async decode(rawData: string): Promise<DecodedTransaction> {
    try {
      // Ensure hex format
      const hexData = rawData.startsWith("0x") ? rawData : `0x${rawData}`;

      if (!isHex(hexData)) {
        throw new Error("Invalid hex format for RLP data");
      }

      // Parse RLP-encoded transaction using viem
      const parsed = parseTransaction(hexData);

      // Determine transaction mode and extract relevant data
      const { mode, tokenId, recipientAddress, amount } = this.analyzeTransaction(parsed);

      return {
        mode,
        senderAddress: "", // Will be filled by verification logic from API response
        recipientAddress,
        amount: amount.toString(), // Convert bigint to string
        tokenId,
        raw: {
          fees: this.calculateFees(parsed).toString(),
          gas: parsed.gas?.toString(),
          nonce: parsed.nonce ? BigInt(parsed.nonce).toString() : undefined,
          data: parsed.data,
        },
      };
    } catch (error) {
      throw new Error(`Failed to decode EVM transaction: ${error instanceof Error ? error.message : error}`);
    }
  }

  private analyzeTransaction(parsed: any): {
    mode: TransactionMode;
    tokenId?: string;
    recipientAddress: string;
    amount: bigint;
  } {
    const to = parsed.to;
    const value = parsed.value || 0n;
    const data = parsed.data;

    // Check if this is a token transfer (ERC-20)
    if (data && data.length >= 10 && data.startsWith("0xa9059cbb")) {
      // ERC-20 transfer function signature
      return {
        mode: "transferToken",
        tokenId: to ? getAddress(to) : undefined, // Contract address
        recipientAddress: this.extractERC20Recipient(data),
        amount: this.extractERC20Amount(data),
      };
    }

    // Regular ETH transfer
    return {
      mode: "transfer",
      recipientAddress: to ? getAddress(to) : "",
      amount: BigInt(value),
    };
  }

  private extractERC20Recipient(data: string): string {
    // ERC-20 transfer data format: 0xa9059cbb + 32 bytes recipient + 32 bytes amount
    // Extract recipient address (bytes 4-35, but take last 20 bytes for address)
    const recipientHex = data.slice(34, 74); // Skip function sig (8 chars) + padding (24 chars)
    return getAddress(`0x${recipientHex}`);
  }

  private extractERC20Amount(data: string): bigint {
    // Extract amount (bytes 36-67)
    const amountHex = data.slice(74, 138);
    return BigInt(`0x${amountHex}`);
  }

  private calculateFees(parsed: any): bigint {
    // Calculate total fees based on transaction type
    const gasLimit = parsed.gas || 0n;

    if (parsed.maxFeePerGas) {
      // EIP-1559 transaction
      return BigInt(gasLimit) * BigInt(parsed.maxFeePerGas);
    } else if (parsed.gasPrice) {
      // Legacy transaction
      return BigInt(gasLimit) * BigInt(parsed.gasPrice);
    }

    return 0n;
  }

  validate(decodedData: unknown): boolean {
    const tx = decodedData as DecodedTransaction;

    // Basic validation
    if (!tx || typeof tx !== "object") return false;

    // Check required fields exist
    const requiredFields = ["mode", "recipientAddress", "amount"];
    if (!requiredFields.every((field) => field in tx)) return false;

    // Validate addresses - senderAddress is optional in DecodedTransaction
    if (!isAddress(tx.recipientAddress)) return false;
    if (tx.senderAddress && !isAddress(tx.senderAddress)) return false;

    // Validate mode
    const validModes = ["transfer", "transferToken"];
    if (!validModes.includes(tx.mode)) return false;

    // For token transfers, tokenId should be present and a valid address
    if (tx.mode === "transferToken" && (!tx.tokenId || !isAddress(tx.tokenId))) return false;

    return true;
  }

}
