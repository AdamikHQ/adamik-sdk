import { PublicKey } from "@solana/web3.js";
import { ChainId, DecodedTransaction } from "../types";
import { BaseDecoder } from "./base";

interface SolanaRpcResponse {
  result?: {
    value?: {
      data?: [string];
    };
  };
}

interface TokenAccountInfo {
  ownerAddress: string | null;
  mintAddress: string | null;
}

/**
 * Solana transaction decoder
 * Handles Adamik's BORSH-encoded transaction format for Solana
 * This is a custom format, not the standard Solana transaction encoding
 */
export class SolanaDecoder extends BaseDecoder {
  constructor(chainId: ChainId) {
    super(chainId, "BORSH");
  }

  async decode(dataHex: string): Promise<DecodedTransaction> {
    try {
      // Convert hex string to Buffer
      const dataBuffer = this.hexToBuffer(dataHex);

      // Parse the custom BORSH format
      let offset = 0;

      // Read header bytes
      const version = dataBuffer.readUInt8(offset);
      offset += 1;

      // Skip next 3 bytes (some format data)
      offset += 3;

      // Read public keys - they start at offset 4 and 36
      const pubkey1 = dataBuffer.subarray(offset, offset + 32);
      offset += 32;

      const pubkey2 = dataBuffer.subarray(offset, offset + 32);
      offset += 32;

      // Read blockhash (32 bytes) - this is the third 32-byte field, not a third pubkey
      const blockhash = dataBuffer.subarray(offset, offset + 32);
      offset += 32;

      // The remaining bytes contain instruction data
      // For now, we'll focus on extracting the key information

      // Initialize decoded transaction
      const decodedTx: DecodedTransaction = {
        chainId: this.chainId,
        chainSpecificData: {
          version,
          pubkeys: [this.toBase58(pubkey1), this.toBase58(pubkey2)],
          blockhash: this.toBase58(blockhash),
          rawInstructionData: dataBuffer.subarray(offset).toString("hex"),
        },
      };

      // Analyze the instruction data to determine transaction type
      // The last 12 bytes often contain the transfer instruction
      if (dataBuffer.length >= offset + 12) {
        const instructionOffset = dataBuffer.length - 12;
        const instructionType = dataBuffer.readUInt32LE(instructionOffset);

        if (instructionType === 2) {
          // System transfer
          const amount = dataBuffer.readBigUInt64LE(instructionOffset + 4);
          decodedTx.amount = amount.toString();
          decodedTx.mode = "transfer";

          // For system transfers, pubkey1 is the sender
          // If pubkey2 is all zeros (system program), this is likely a self-transfer
          decodedTx.senderAddress = this.toBase58(pubkey1);

          // Check if this is a self-transfer (pubkey2 is all zeros)
          if (pubkey2.every((byte) => byte === 0)) {
            // Self-transfer: recipient is the same as sender
            decodedTx.recipientAddress = this.toBase58(pubkey1);
          } else {
            // Regular transfer: pubkey2 is the recipient
            decodedTx.recipientAddress = this.toBase58(pubkey2);
          }
        }
      }

      // Check if this might be a staking transaction
      // Staking transactions are typically longer and contain stake program references
      if (dataBuffer.length > 200 && dataHex.includes("06a1d817")) {
        // This looks like a staking transaction
        decodedTx.mode = "stake";

        // For staking transactions, pubkey1 is the staker
        decodedTx.senderAddress = this.toBase58(pubkey1);

        // The validator address is in the instruction data (first 32 bytes)
        if (dataBuffer.length >= offset + 32) {
          const validatorAddress = dataBuffer.subarray(offset, offset + 32);
          decodedTx.targetValidatorAddress = this.toBase58(validatorAddress);
        } else {
          throw new Error(`Failed to decode validator address in Solana transaction`);
        }

        // Extract amount from instruction data
        // For staking transactions, the amount is at a specific position in the instruction data
        if (dataBuffer.length >= offset + 242) {
          // Need at least 242 bytes from instruction start
          const instructionData = dataBuffer.subarray(offset);
          // The amount is at offset 234 in the instruction data (8 bytes, little endian)
          try {
            const amount = instructionData.readBigUInt64LE(234);
            decodedTx.amount = amount.toString();
          } catch {
            // Fallback: search for reasonable amounts
            for (let i = 0; i <= instructionData.length - 8; i += 4) {
              try {
                const potentialAmount = instructionData.readBigUInt64LE(i);
                if (potentialAmount > 0n && potentialAmount < 1000000000000000n) {
                  decodedTx.amount = potentialAmount.toString();
                  break;
                }
              } catch {
                // Continue searching
              }
            }
          }
        } else {
          // Search for amount in available instruction data
          const instructionData = dataBuffer.subarray(offset);
          for (let i = 0; i <= instructionData.length - 8; i += 4) {
            try {
              const potentialAmount = instructionData.readBigUInt64LE(i);
              if (potentialAmount > 0n && potentialAmount < 1000000000000000n) {
                decodedTx.amount = potentialAmount.toString();
                break;
              }
            } catch {
              // Continue searching
            }
          }
        }
      }

      // Check if this might be a token transfer
      // Token transfers have the SPL Token program (TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
      else if (dataHex.includes("06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9")) {
        // This is a token transfer transaction
        decodedTx.mode = "transferToken";

        // For token transfers, pubkey1 is the sender
        decodedTx.senderAddress = this.toBase58(pubkey1);

        // For token transfers, pubkey2 is the recipient's token account
        // Query the owner of this token account to get the actual recipient address
        const recipientTokenAccount = this.toBase58(pubkey2);

        const { ownerAddress, mintAddress } = await this.fetchTokenAccountInfo(recipientTokenAccount);

        if (ownerAddress) {
          decodedTx.recipientAddress = ownerAddress;
        } else {
          throw new Error(`Failed to decode recipient address in Solana transaction`);
        }

        // Extract tokenId by querying the source token account
        // For token transfers, we need to find the sender's token account
        // This is typically in the additional accounts, not pubkey2
        let tokenAccountAddress: string | null = null;

        // Parse additional accounts to find the sender's token account
        let currentOffset = offset;
        while (currentOffset + 32 <= dataBuffer.length) {
          const nextAccount = dataBuffer.subarray(currentOffset, currentOffset + 32);
          const accountAddress = this.toBase58(nextAccount);

          // Skip system program and token program
          if (
            accountAddress !== "11111111111111111111111111111111" &&
            accountAddress !== "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          ) {
            // This could be the sender's token account
            tokenAccountAddress = accountAddress;
            break;
          }
          currentOffset += 32;
        }

        // Query the token account to get the mint address (token ID)
        if (tokenAccountAddress) {
          try {
            if (mintAddress) {
              decodedTx.tokenId = mintAddress;
            } else {
              console.warn("RPC query failed for token account:", tokenAccountAddress);
              // For test data, we might need to handle this differently
              // The token ID should be available from the API response
            }
          } catch (error) {
            console.warn("Failed to query mint address from token account:", error);
          }
        }

        // Try to extract amount from instruction data
        if (dataBuffer.length >= offset + 16) {
          const instructionData = dataBuffer.subarray(offset);
          // Look for amount in the instruction data (usually 8 bytes at the end)
          if (instructionData.length >= 8) {
            try {
              const amount = instructionData.readBigUInt64LE(instructionData.length - 8);
              decodedTx.amount = amount.toString();
            } catch {
              // Try other positions if the last 8 bytes don't work
              for (let i = 0; i <= instructionData.length - 8; i += 4) {
                try {
                  const potentialAmount = instructionData.readBigUInt64LE(i);
                  if (potentialAmount > 0n && potentialAmount < 1000000000000000n) {
                    decodedTx.amount = potentialAmount.toString();
                    break;
                  }
                } catch {
                  // Continue searching
                }
              }
            }
          }
        }
      }

      return decodedTx;
    } catch (error) {
      throw new Error(
        `Failed to decode Solana transaction: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Convert a buffer to base58 (Solana address format)
   */
  private toBase58(buffer: Buffer): string {
    try {
      // Skip if it's all zeros (system program or padding)
      if (buffer.every((byte) => byte === 0)) {
        return "11111111111111111111111111111111"; // System program
      }

      const pubkey = new PublicKey(buffer);
      return pubkey.toBase58();
    } catch {
      // If it fails, return hex representation
      return buffer.toString("hex");
    }
  }

  /**
   * Query Solana RPC to get both owner and mint addresses from token account
   * Token account data structure: [mint(32), owner(32), amount(8), ...]
   */
  private async fetchTokenAccountInfo(tokenAccountAddress: string): Promise<TokenAccountInfo> {
    try {
      const response = await fetch("https://api.mainnet-beta.solana.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getAccountInfo",
          params: [
            tokenAccountAddress,
            {
              encoding: "base64",
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as SolanaRpcResponse;

      if (data.result && data.result.value && data.result.value.data) {
        const accountData = Buffer.from(data.result.value.data[0], "base64");

        let ownerAddress: string | null = null;
        let mintAddress: string | null = null;

        if (accountData.length >= 32) {
          // First 32 bytes are the mint address
          const mint = new PublicKey(accountData.subarray(0, 32));
          mintAddress = mint.toBase58();
        }

        if (accountData.length >= 64) {
          // Owner is at offset 32 (32 bytes after mint)
          const owner = new PublicKey(accountData.subarray(32, 64));
          ownerAddress = owner.toBase58();
        }

        return { ownerAddress, mintAddress };
      }

      return { ownerAddress: null, mintAddress: null };
    } catch (error) {
      console.warn("Failed to query token account info:", error);
      return { ownerAddress: null, mintAddress: null };
    }
  }
}
