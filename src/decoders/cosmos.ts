import { BaseDecoder } from "./base";
import { ChainId, DecodedTransaction, TransactionMode } from "../types";
import { decodeTxRaw } from "@cosmjs/proto-signing";
import { fromHex } from "@cosmjs/encoding";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { MsgDelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { SignDoc, TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";

/**
 * Cosmos SDK chain decoder
 * 
 * Handles transaction decoding for Cosmos SDK based chains including:
 * - Cosmos Hub
 * - Celestia
 * - Injective
 * - Babylon
 * - And other Cosmos SDK chains
 */
export class CosmosDecoder extends BaseDecoder {
  constructor(chainId: ChainId) {
    super(chainId, "COSMOS_PROTOBUF");
  }

  /**
   * Decode Cosmos protobuf transaction
   * 
   * @param rawData - Hex-encoded protobuf transaction data or SignDoc
   * @returns Decoded transaction information
   */
  async decode(rawData: string): Promise<DecodedTransaction> {
    try {
      // Remove 0x prefix if present
      const cleanData = rawData.startsWith("0x") ? rawData.slice(2) : rawData;
      
      // Try to parse as SignDoc first (SIGNDOC_DIRECT format)
      try {
        const signDocBytes = fromHex(cleanData);
        const signDoc = SignDoc.decode(signDocBytes);
        
        // Parse the body bytes to get the messages
        const txRaw = TxRaw.encode({
          bodyBytes: signDoc.bodyBytes,
          authInfoBytes: signDoc.authInfoBytes,
          signatures: [] // SignDoc doesn't contain signatures
        }).finish();
        
        const decodedTx = decodeTxRaw(txRaw);
        
        // Process the first message
        if (decodedTx.body.messages.length > 0) {
          const firstMsg = decodedTx.body.messages[0];
          
          if (firstMsg.typeUrl === "/cosmos.bank.v1beta1.MsgSend") {
            const msgSend = MsgSend.decode(firstMsg.value);
            
            // Calculate total amount from all denominations
            let totalAmount = "0";
            if (msgSend.amount.length > 0) {
              // For simplicity, we'll use the first denomination
              // In production, you might want to handle multiple denoms
              totalAmount = msgSend.amount[0].amount;
            }
            
            return {
              mode: "transfer" as TransactionMode,
              senderAddress: msgSend.fromAddress,
              recipientAddress: msgSend.toAddress,
              amount: totalAmount,
              raw: rawData,
            };
          } else if (firstMsg.typeUrl === "/cosmos.staking.v1beta1.MsgDelegate") {
            const msgDelegate = MsgDelegate.decode(firstMsg.value);
            
            // For staking, amount is in the delegation
            let totalAmount = "0";
            if (msgDelegate.amount) {
              totalAmount = msgDelegate.amount.amount;
            }
            
            return {
              mode: "stake" as TransactionMode,
              senderAddress: msgDelegate.delegatorAddress,
              targetValidatorAddress: msgDelegate.validatorAddress,
              amount: totalAmount,
              raw: rawData,
            };
          }
        }
        
        // Fallback for non-transfer messages
        return {
          mode: "transfer" as TransactionMode,
          recipientAddress: "cosmos1unknown",
          amount: "0",
          raw: rawData,
        };
        
      } catch (signDocError) {
        // If not a SignDoc, try as raw transaction
        const txBytes = fromHex(cleanData);
        const decodedTx = decodeTxRaw(txBytes);
        
        // Process the first message
        if (decodedTx.body.messages.length > 0) {
          const firstMsg = decodedTx.body.messages[0];
          
          if (firstMsg.typeUrl === "/cosmos.bank.v1beta1.MsgSend") {
            const msgSend = MsgSend.decode(firstMsg.value);
            
            let totalAmount = "0";
            if (msgSend.amount.length > 0) {
              totalAmount = msgSend.amount[0].amount;
            }
            
            return {
              mode: "transfer" as TransactionMode,
              senderAddress: msgSend.fromAddress,
              recipientAddress: msgSend.toAddress,
              amount: totalAmount,
              raw: rawData,
            };
          } else if (firstMsg.typeUrl === "/cosmos.staking.v1beta1.MsgDelegate") {
            const msgDelegate = MsgDelegate.decode(firstMsg.value);
            
            let totalAmount = "0";
            if (msgDelegate.amount) {
              totalAmount = msgDelegate.amount.amount;
            }
            
            return {
              mode: "stake" as TransactionMode,
              senderAddress: msgDelegate.delegatorAddress,
              targetValidatorAddress: msgDelegate.validatorAddress,
              amount: totalAmount,
              raw: rawData,
            };
          }
        }
        
        return {
          mode: "transfer" as TransactionMode,
          recipientAddress: "cosmos1unknown",
          amount: "0",
          raw: rawData,
        };
      }
      
    } catch (error) {
      throw new Error(`Failed to decode Cosmos transaction: ${error}`);
    }
  }

  /**
   * Validate decoded Cosmos transaction data
   * 
   * @param decodedData - The decoded transaction data to validate
   * @returns True if valid, false otherwise
   */
  validate(decodedData: unknown): boolean {
    if (!decodedData || typeof decodedData !== "object") {
      return false;
    }

    const data = decodedData as DecodedTransaction;

    // Basic validation
    if (!data.mode || !data.raw) {
      return false;
    }

    // Validate Cosmos addresses if present
    if (data.recipientAddress && !this.isValidCosmosAddress(data.recipientAddress)) {
      return false;
    }
    
    if (data.senderAddress && !this.isValidCosmosAddress(data.senderAddress)) {
      return false;
    }

    return true;
  }

  /**
   * Validate Cosmos bech32 address
   */
  private isValidCosmosAddress(address: string): boolean {
    try {
      // Check basic format first
      const validPrefixes = ["cosmos", "celestia", "osmo", "juno", "secret", "inj", "bbn"];
      const prefix = address.split("1")[0];
      
      if (!validPrefixes.includes(prefix)) {
        return false;
      }
      
      // For now, just validate the basic format
      // Full bech32 validation would require additional parsing
      return address.length > 39 && address.includes("1");
    } catch {
      return false;
    }
  }
}