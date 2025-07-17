import AdamikSDK, { AdamikEncodeResponse, TransactionIntent } from "../src";

async function verifyEthereumTransfer() {
  console.log("🔍 Verifying Ethereum Transfer Transaction\n");

  const sdk = new AdamikSDK();

  // Original transaction intent
  const intent: TransactionIntent = {
    mode: "transfer",
    senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
    recipientAddress: "0x5aAeb6053F3e94c9B8Bfc4443cF2E5A3e3Bdc5E2",
    amount: "1500000000000000000", // 1.5 ETH
  };

  // Simulated API response (in real usage, this would come from Adamik API)
  const apiResponse: AdamikEncodeResponse = {
    chainId: "ethereum",
    transaction: {
      data: {
        mode: "transfer",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: "0x5aAeb6053F3e94c9B8Bfc4443cF2E5A3e3Bdc5E2",
        amount: "1500000000000000000",
        fees: "21000000000000", // 0.000021 ETH
        gas: "21000",
        nonce: "42",
      },
      encoded: [
        {
          hash: {
            format: "keccak256",
            value: "0x7c5ea36004851c764c44143b1dcb59679b11c9a68e5f41497f6cf3d480715331",
          },
          raw: {
            format: "RLP",
            value:
              "0xf86a2a850430e23400825208945aaeb6053f3e94c9b8bfc4443cf2e5a3e3bdc5e28814d1120d7b160000801ba0",
          },
        },
      ],
    },
  };

  const result = await sdk.verify(apiResponse, intent);

  if (result.isValid) {
    console.log("✅ Transaction verified successfully!\n");
    console.log("Transaction Details:");
    console.log("- Chain:", result.decodedData?.chainId);
    console.log("- From:", result.decodedData?.transaction.senderAddress);
    console.log("- To:", result.decodedData?.transaction.recipientAddress);
    console.log("- Amount:", result.decodedData?.transaction.amount, "wei");
    console.log("- Fees:", result.decodedData?.transaction.fees, "wei");
    console.log("- Gas:", result.decodedData?.transaction.gas);
    console.log("- Nonce:", result.decodedData?.transaction.nonce);
  } else {
    console.error("❌ Verification failed!\n");
    console.error("Errors:");
    result.errors?.forEach((error) => console.error(`- ${error}`));
  }
}

async function verifyTokenTransfer() {
  console.log("\n🔍 Verifying Token Transfer Transaction\n");

  const sdk = new AdamikSDK();

  const intent: TransactionIntent = {
    mode: "transferToken",
    tokenId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
    senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
    recipientAddress: "0x5aAeb6053F3e94c9B8Bfc4443cF2E5A3e3Bdc5E2",
    amount: "1000000", // 1 USDC (6 decimals)
  };

  const apiResponse: AdamikEncodeResponse = {
    chainId: "ethereum",
    transaction: {
      data: {
        mode: "transferToken",
        tokenId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: "0x5aAeb6053F3e94c9B8Bfc4443cF2E5A3e3Bdc5E2",
        amount: "1000000",
        fees: "50000000000000", // Higher gas for token transfer
        gas: "65000",
        nonce: "43",
      },
      encoded: [
        {
          hash: {
            format: "keccak256",
            value: "0x8f9a2c4b6e8d1a3f5c7b9d2e4a6c8e1b3d5f7a9c2e4b6d8f1a3c5e7b9d2f4a6c",
          },
          raw: {
            format: "RLP",
            value: "0xf8a92b850430e2340082fde894a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4880b844a9059cbb",
          },
        },
      ],
    },
  };

  const result = await sdk.verify(apiResponse, intent);

  if (result.isValid) {
    console.log("✅ Token transfer verified successfully!\n");
    console.log("Token Transfer Details:");
    console.log("- Token:", result.decodedData?.transaction.tokenId);
    console.log("- Amount:", result.decodedData?.transaction.amount, "units");
  } else {
    console.error("❌ Verification failed!\n");
    console.error("Errors:");
    result.errors?.forEach((error) => console.error(`- ${error}`));
  }
}

async function verifyMismatchedTransaction() {
  console.log("\n🔍 Testing Mismatched Transaction (Should Fail)\n");

  const sdk = new AdamikSDK();

  const intent: TransactionIntent = {
    mode: "transfer",
    senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
    recipientAddress: "0x5aAeb6053F3e94c9B8Bfc4443cF2E5A3e3Bdc5E2",
    amount: "1000000000000000000", // 1 ETH
  };

  // API response with different amount
  const apiResponse: AdamikEncodeResponse = {
    chainId: "ethereum",
    transaction: {
      data: {
        mode: "transfer",
        senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
        recipientAddress: "0x5aAeb6053F3e94c9B8Bfc4443cF2E5A3e3Bdc5E2",
        amount: "2000000000000000000", // 2 ETH (mismatch!)
        fees: "21000000000000",
        gas: "21000",
        nonce: "44",
      },
      encoded: [],
    },
  };

  const result = await sdk.verify(apiResponse, intent);

  if (!result.isValid) {
    console.log("✅ Correctly detected mismatch!\n");
    console.log("Validation Errors:");
    result.errors?.forEach((error) => console.log(`- ${error}`));
  } else {
    console.error("❌ Failed to detect mismatch!");
  }
}

// Run all examples
async function main() {
  console.log("=== Adamik SDK Verification Examples ===\n");

  await verifyEthereumTransfer();
  await verifyTokenTransfer();
  await verifyMismatchedTransaction();

  console.log("\n=== Examples Complete ===");
}

main().catch(console.error);
