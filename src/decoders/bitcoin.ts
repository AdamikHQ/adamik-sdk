import { BaseDecoder } from "./base";
import { ChainId, DecodedTransaction } from "../types";
import * as bitcoin from "bitcoinjs-lib";

interface BitcoinDecodedData {
  version: number;
  inputs: Array<{
    txid: string;
    vout: number;
    witnessUtxo?: {
      script: Buffer;
      value: number;
    };
    nonWitnessUtxo?: Buffer;
  }>;
  outputs: Array<{
    script: Buffer;
    value: number;
  }>;
  globalMap: Map<Buffer, Buffer>;
}

export class BitcoinDecoder extends BaseDecoder {
  constructor(chainId: ChainId) {
    super(chainId, "PSBT");
  }

  async decode(rawData: string): Promise<DecodedTransaction> {
    try {
      // Convert hex string to buffer
      const buffer = Buffer.from(rawData, 'hex');
      
      // Parse PSBT using bitcoinjs-lib
      const psbt = bitcoin.Psbt.fromBuffer(buffer);
      
      // Extract transaction outputs
      const txOutputs = psbt.txOutputs;
      if (!txOutputs || txOutputs.length === 0) {
        throw new Error("No outputs found in PSBT");
      }
      
      // Get outputs and calculate total amount
      let recipientAddress = "";
      let totalAmount = BigInt(0);
      
      // For each output, decode the address
      txOutputs.forEach((output: {script: Buffer; value: number}, index: number) => {
        try {
          // Try to decode the address from the script
          const address = bitcoin.address.fromOutputScript(
            output.script,
            this.chainId === "bitcoin" ? bitcoin.networks.bitcoin : bitcoin.networks.testnet
          );
          
          // First output is typically the recipient (second might be change)
          if (index === 0) {
            recipientAddress = address;
            totalAmount = BigInt(output.value);
          }
        } catch (e) {
          // Some outputs might not have standard addresses (e.g., OP_RETURN)
          console.warn(`Could not decode address for output ${index}`);
        }
      });
      
      // Get sender information from inputs
      let senderAddress = "";
      if (psbt.data.inputs.length > 0) {
        const firstInput = psbt.data.inputs[0];
        
        // Try to extract sender address from witness UTXO
        if (firstInput.witnessUtxo) {
          try {
            senderAddress = bitcoin.address.fromOutputScript(
              firstInput.witnessUtxo.script,
              this.chainId === "bitcoin" ? bitcoin.networks.bitcoin : bitcoin.networks.testnet
            );
          } catch (e) {
            console.warn("Could not decode sender address from witness UTXO");
          }
        }
      }
      
      return {
        mode: "transfer",
        recipientAddress,
        amount: totalAmount.toString(),
        senderAddress,
        raw: {
          psbt: psbt.toBase64(),
          inputs: psbt.data.inputs.length,
          outputs: txOutputs.length,
        },
      };
    } catch (error) {
      throw new Error(`Failed to decode Bitcoin PSBT: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  validate(decodedData: unknown): boolean {
    const tx = decodedData as DecodedTransaction;

    // Basic validation
    if (!tx || typeof tx !== "object") return false;

    // Check required fields for a decoded transaction
    return (
      "mode" in tx &&
      "recipientAddress" in tx &&
      typeof tx.recipientAddress === "string" &&
      "amount" in tx &&
      typeof tx.amount === "string"
    );
  }
}
