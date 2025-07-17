import AdamikSDK, { AdamikAPIClient, TransactionIntent, ChainId } from "../src";

/**
 * Example showing how to use the real Adamik API with verification
 */
async function realApiExample() {
  console.log("🚀 Real Adamik API Integration Example\n");

  // 1. Create API client (you can use environment variables or config)
  const apiClient = new AdamikAPIClient({
    baseUrl: process.env.ADAMIK_API_BASE_URL || "https://api.adamik.io",
    apiKey: process.env.ADAMIK_API_KEY || "your-api-key-here",
    timeout: 30000,
  });

  // Alternative: Create from environment variables
  // const apiClient = AdamikAPIClient.fromEnvironment();

  // 2. Test connection first
  console.log("🔗 Testing API connection...");
  const connectionTest = await apiClient.testConnection();
  if (!connectionTest.success) {
    console.error("❌ API connection failed:", connectionTest.message);
    console.log("\n💡 Make sure you have valid ADAMIK_API_BASE_URL and ADAMIK_API_KEY");
    return;
  }
  console.log("✅ API connection successful!\n");

  // 3. Create verification SDK
  const sdk = new AdamikSDK();

  // 4. Define your transaction intent
  const intent: TransactionIntent = {
    mode: "transfer",
    senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
    recipientAddress: "0x5aAeb6053F3e94c9B8Bfc4443cF2E5A3e3Bdc5E2",
    amount: "1000000000000000000", // 1 ETH in wei
  };

  const chainId: ChainId = "ethereum";

  try {
    console.log("📝 Encoding transaction with Adamik API...");
    console.log("Intent:", JSON.stringify(intent, null, 2));

    // 5. Call real Adamik API to encode the transaction
    const apiResponse = await apiClient.encodeTransaction(chainId, intent);

    console.log("✅ Transaction encoded successfully!");
    console.log("Response preview:");
    console.log("- Chain ID:", apiResponse.chainId);
    console.log("- Mode:", apiResponse.transaction.data.mode);
    console.log("- Amount:", apiResponse.transaction.data.amount);
    console.log("- Fees:", apiResponse.transaction.data.fees);
    console.log("- Encoded formats:", apiResponse.transaction.encoded.map((e) => e.raw?.format).join(", "));

    // 6. Verify the API response against your original intent
    console.log("\n🔍 Verifying API response...");
    const verificationResult = await sdk.verify(apiResponse, intent);

    if (verificationResult.isValid) {
      console.log("✅ Verification successful! The API response matches your intent.");
      console.log("\nTransaction is ready for signing:");
      console.log("- Hash to sign:", apiResponse.transaction.encoded[0]?.hash?.value);
      console.log("- Format:", apiResponse.transaction.encoded[0]?.hash?.format);
      console.log("- Raw transaction:", apiResponse.transaction.encoded[0]?.raw?.value);
    } else {
      console.error("❌ Verification failed!");
      console.error("Errors:", verificationResult.errors);
      console.log("\n⚠️  Do not sign this transaction - it doesn't match your intent!");
    }
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);

    if (error instanceof Error && error.message.includes("ADAMIK_API_KEY")) {
      console.log("\n💡 To run this example with real API:");
      console.log("export ADAMIK_API_BASE_URL=https://api.adamik.io");
      console.log("export ADAMIK_API_KEY=your-actual-api-key");
    }
  }
}

/**
 * Example with token transfer
 */
async function tokenTransferExample() {
  console.log("\n🪙 Token Transfer Example\n");

  try {
    const apiClient = AdamikAPIClient.fromEnvironment();
    const sdk = new AdamikSDK();

    const intent: TransactionIntent = {
      mode: "transferToken",
      tokenId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
      senderAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f7BBDc",
      recipientAddress: "0x5aAeb6053F3e94c9B8Bfc4443cF2E5A3e3Bdc5E2",
      amount: "1000000", // 1 USDC (6 decimals)
    };

    console.log("📝 Encoding USDC transfer...");
    const apiResponse = await apiClient.encodeTransaction("ethereum", intent);

    console.log("✅ Token transfer encoded!");
    console.log("- Token:", apiResponse.transaction.data.tokenId);
    console.log("- Amount:", apiResponse.transaction.data.amount, "units");

    const verificationResult = await sdk.verify(apiResponse, intent);
    if (verificationResult.isValid) {
      console.log("✅ Token transfer verification successful!");
    } else {
      console.error("❌ Token transfer verification failed:", verificationResult.errors);
    }
  } catch (error) {
    console.error("❌ Token transfer error:", error instanceof Error ? error.message : error);
  }
}

/**
 * Example with staking transaction
 */
async function stakingExample() {
  console.log("\n🥩 Staking Example\n");

  try {
    const apiClient = AdamikAPIClient.fromEnvironment();
    const sdk = new AdamikSDK();

    const intent: TransactionIntent = {
      mode: "stake",
      senderAddress: "cosmos1abc123...", // Cosmos address example
      targetValidatorAddress: "cosmosvaloper1xyz...", // Validator address
      amount: "1000000", // 1 ATOM (6 decimals)
    };

    console.log("📝 Encoding stake transaction...");
    const apiResponse = await apiClient.encodeTransaction("cosmos", intent);

    console.log("✅ Stake transaction encoded!");
    console.log("- Validator:", apiResponse.transaction.data.targetValidatorAddress);
    console.log("- Amount:", apiResponse.transaction.data.amount, "units");

    const verificationResult = await sdk.verify(apiResponse, intent);
    if (verificationResult.isValid) {
      console.log("✅ Staking verification successful!");
    } else {
      console.error("❌ Staking verification failed:", verificationResult.errors);
    }
  } catch (error) {
    console.error("❌ Staking error:", error instanceof Error ? error.message : error);
  }
}

// Run all examples
async function main() {
  console.log("=== Adamik SDK Real API Integration Examples ===\n");

  await realApiExample();

  // Only run additional examples if API credentials are available
  if (process.env.ADAMIK_API_KEY && process.env.ADAMIK_API_BASE_URL) {
    await tokenTransferExample();
    await stakingExample();
  } else {
    console.log("\n💡 Set ADAMIK_API_KEY and ADAMIK_API_BASE_URL to run additional examples");
  }

  console.log("\n=== Examples Complete ===");
}

main().catch(console.error);
