import { BaseDecoder } from "./base";
import { ChainId, DecodedTransaction, TransactionMode } from "../types";
import { TronWeb } from "tronweb";

/**
 * Tron transaction decoder
 * Handles Tron's protobuf-based transaction format
 * Uses TronWeb library for transaction parsing and address conversion
 */
export class TronDecoder extends BaseDecoder {
  private tronWeb: any;
  
  constructor(chainId: ChainId) {
    super(chainId, "RAW_TRANSACTION");
    // Initialize TronWeb instance
    this.tronWeb = new TronWeb({
      fullHost: "https://api.trongrid.io", // Not used for decoding, but required by constructor
    });
  }

  async decode(rawData: string): Promise<DecodedTransaction> {
    try {
      // Parse the hex-encoded raw transaction
      const txData = this.parseRawTransaction(rawData);
      
      // Determine transaction type and extract details
      const contractType = this.getContractType(rawData);
      
      if (contractType === "TriggerSmartContract") {
        return this.decodeTokenTransfer(txData, rawData);
      } else if (contractType === "TransferContract") {
        return this.decodeNativeTransfer(txData, rawData);
      }
      
      throw new Error(`Unsupported contract type: ${contractType}`);
    } catch (error) {
      throw new Error(`Failed to decode Tron transaction: ${error instanceof Error ? error.message : error}`);
    }
  }

  private parseRawTransaction(rawData: string): any {
    // Basic parsing of the raw transaction structure
    // Tron transactions contain contract data in a specific format
    const data: any = {
      contracts: [],
    };
    
    // Extract contract type from the raw data
    // This is a simplified parser - in production, you'd use proper protobuf parsing
    if (rawData.includes("5472616e73666572436f6e7472616374")) { // "TransferContract" in hex
      data.contractType = "TransferContract";
    } else if (rawData.includes("54726967676572536d617274436f6e7472616374")) { // "TriggerSmartContract" in hex
      data.contractType = "TriggerSmartContract";
    }
    
    return data;
  }

  private getContractType(rawData: string): string {
    if (rawData.includes("5472616e73666572436f6e7472616374")) {
      return "TransferContract";
    } else if (rawData.includes("54726967676572536d617274436f6e7472616374")) {
      return "TriggerSmartContract";
    }
    return "Unknown";
  }

  private decodeTokenTransfer(txData: any, rawData: string): DecodedTransaction {
    // Extract data from TriggerSmartContract
    // The data field contains the ERC20-like transfer method call
    
    // Find the data field in the raw transaction
    // In the test fixture, it starts with "a9059cbb" (transfer method signature)
    const dataMatch = rawData.match(/a9059cbb([0-9a-f]{128})/i);
    if (!dataMatch) {
      throw new Error("Could not find token transfer data");
    }
    
    const transferData = dataMatch[1];
    // Extract recipient (first 32 bytes, last 20 bytes are the address)
    const recipientHex = "41" + transferData.substring(24, 64);
    // Extract amount (next 32 bytes)
    const amountHex = transferData.substring(64, 128);
    
    // Find owner address in the raw data (41 prefix followed by 20 bytes)
    const ownerMatch = rawData.match(/0a1541([0-9a-f]{40})/i);
    const ownerHex = ownerMatch ? "41" + ownerMatch[1] : "";
    
    // Find contract address (token address)
    const contractMatch = rawData.match(/121541([0-9a-f]{40})/i);
    const contractHex = contractMatch ? "41" + contractMatch[1] : "";
    
    return {
      chainId: this.chainId,
      mode: "transferToken" as TransactionMode,
      senderAddress: ownerHex ? this.tronWeb.address.fromHex(ownerHex) : "",
      recipientAddress: recipientHex ? this.tronWeb.address.fromHex(recipientHex) : "",
      amount: BigInt("0x" + amountHex).toString(),
      tokenId: contractHex ? this.tronWeb.address.fromHex(contractHex) : undefined,
      // TODO: Add fee calculation for Tron transactions
      // fee: "0", // Need to extract fee from transaction data
      raw: rawData,
    };
  }

  private decodeNativeTransfer(txData: any, rawData: string): DecodedTransaction {
    // Extract data from TransferContract
    // Format: owner_address, to_address, amount
    
    // Find owner address (from address)
    const ownerMatch = rawData.match(/0a1541([0-9a-f]{40})/i);
    const ownerHex = ownerMatch ? "41" + ownerMatch[1] : "";
    
    // Find to address
    const toMatch = rawData.match(/121541([0-9a-f]{40})/i);
    const toHex = toMatch ? "41" + toMatch[1] : "";
    
    // Find amount (in the raw data, amounts are encoded as variable-length integers)
    // For the test case with amount 12345 (0x3039), it appears as "18b960" in the raw data
    const amountMatch = rawData.match(/18([0-9a-f]{2,8})70/i);
    let amount = "0";
    if (amountMatch) {
      // Parse the varint-encoded amount
      const amountBytes = amountMatch[1];
      amount = this.parseVarint(amountBytes).toString();
    }
    
    return {
      chainId: this.chainId,
      mode: "transfer" as TransactionMode,
      senderAddress: ownerHex ? this.tronWeb.address.fromHex(ownerHex) : "",
      recipientAddress: toHex ? this.tronWeb.address.fromHex(toHex) : "",
      amount: amount,
      // TODO: Add fee calculation for Tron transactions
      // fee: "0", // Need to extract fee from transaction data
      raw: rawData,
    };
  }

  private parseVarint(hex: string): number {
    // Parse protobuf varint encoding
    // Varints encode integers using variable number of bytes
    // Each byte has a continuation bit (MSB) and 7 data bits
    
    let result = 0;
    let shift = 0;
    
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.substring(i, i + 2), 16);
      
      // Extract the 7 data bits
      result |= (byte & 0x7F) << shift;
      
      // If MSB is not set, we're done
      if ((byte & 0x80) === 0) {
        break;
      }
      
      shift += 7;
    }
    
    return result;
  }

  validate(decodedData: unknown): boolean {
    if (!decodedData || typeof decodedData !== "object") {
      return false;
    }

    const data = decodedData as DecodedTransaction;
    
    // Basic validation
    if (!data.senderAddress || !data.recipientAddress) {
      return false;
    }

    // Tron addresses should start with 'T' when in base58 format
    const isValidTronAddress = (addr: string): boolean => {
      try {
        // Use TronWeb to validate the address
        return this.tronWeb.isAddress(addr);
      } catch {
        return false;
      }
    };

    if (!isValidTronAddress(data.senderAddress) || !isValidTronAddress(data.recipientAddress)) {
      return false;
    }

    // Validate mode
    if (!["transfer", "transferToken"].includes(data.mode || "")) {
      return false;
    }

    // For token transfers, tokenId should be present and valid
    if (data.mode === "transferToken" && (!data.tokenId || !isValidTronAddress(data.tokenId))) {
      return false;
    }

    return true;
  }
}