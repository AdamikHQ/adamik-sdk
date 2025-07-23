import { BaseDecoder } from "./base";
import { ChainId, DecodedTransaction, TransactionMode, RawFormat } from "../types";
import { decodeTxRaw } from "@cosmjs/proto-signing";
import { fromHex } from "@cosmjs/encoding";
import { MsgSend } from "cosmjs-types/cosmos/bank/v1beta1/tx";
import { MsgDelegate, MsgUndelegate } from "cosmjs-types/cosmos/staking/v1beta1/tx";
import { MsgWithdrawDelegatorReward } from "cosmjs-types/cosmos/distribution/v1beta1/tx";
import { SignDoc, TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";

type CosmosFormat = Extract<RawFormat, "COSMOS_PROTOBUF" | "SIGNDOC_DIRECT" | "SIGNDOC_DIRECT_JSON" | "SIGNDOC_AMINO" | "SIGNDOC_AMINO_JSON">;

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
  constructor(chainId: ChainId, format: CosmosFormat = "COSMOS_PROTOBUF") {
    super(chainId, format);
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
      
      let decodedTx: any;
      
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
        
        decodedTx = decodeTxRaw(txRaw);
      } catch (signDocError) {
        // If not a SignDoc, try as raw transaction
        const txBytes = fromHex(cleanData);
        decodedTx = decodeTxRaw(txBytes);
      }
      
      // Extract fee information from authInfo
      let fee = "0";
      if (decodedTx.authInfo && decodedTx.authInfo.fee && decodedTx.authInfo.fee.amount.length > 0) {
        // Use the first denomination for the fee (typically uatom, uosmo, etc.)
        fee = decodedTx.authInfo.fee.amount[0].amount;
      }
      
      // Extract memo from body
      const memo = decodedTx.body.memo || undefined;
      
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
            chainId: this.chainId,
            mode: "transfer" as TransactionMode,
            senderAddress: msgSend.fromAddress,
            recipientAddress: msgSend.toAddress,
            amount: totalAmount,
            fee,
            memo,
            chainSpecificData: rawData,
          };
        } else if (firstMsg.typeUrl === "/cosmos.staking.v1beta1.MsgDelegate") {
          const msgDelegate = MsgDelegate.decode(firstMsg.value);
          
          // For staking, amount is in the delegation
          let totalAmount = "0";
          if (msgDelegate.amount) {
            totalAmount = msgDelegate.amount.amount;
          }
          
          return {
            chainId: this.chainId,
            mode: "stake" as TransactionMode,
            senderAddress: msgDelegate.delegatorAddress,
            targetValidatorAddress: msgDelegate.validatorAddress,
            amount: totalAmount,
            fee,
            memo,
            chainSpecificData: rawData,
          };
        } else if (firstMsg.typeUrl === "/cosmos.staking.v1beta1.MsgUndelegate") {
          const msgUndelegate = MsgUndelegate.decode(firstMsg.value);
          
          // For unstaking, amount is in the undelegation
          let totalAmount = "0";
          if (msgUndelegate.amount) {
            totalAmount = msgUndelegate.amount.amount;
          }
          
          return {
            chainId: this.chainId,
            mode: "unstake" as TransactionMode,
            senderAddress: msgUndelegate.delegatorAddress,
            validatorAddress: msgUndelegate.validatorAddress,
            amount: totalAmount,
            fee,
            memo,
            chainSpecificData: rawData,
          };
        } else if (firstMsg.typeUrl === "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward") {
          const msgWithdrawReward = MsgWithdrawDelegatorReward.decode(firstMsg.value);
          
          return {
            chainId: this.chainId,
            mode: "claimRewards" as TransactionMode,
            senderAddress: msgWithdrawReward.delegatorAddress,
            validatorAddress: msgWithdrawReward.validatorAddress,
            amount: "0", // Rewards amount is not known until claimed
            fee,
            memo,
            chainSpecificData: rawData,
          };
        }
      }
      
      // Fallback for non-transfer messages
      return {
        chainId: this.chainId,
        mode: "transfer" as TransactionMode,
        recipientAddress: "cosmos1unknown",
        amount: "0",
        fee,
        memo,
        chainSpecificData: rawData,
      };
      
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
    if (!data.mode || !data.chainSpecificData) {
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