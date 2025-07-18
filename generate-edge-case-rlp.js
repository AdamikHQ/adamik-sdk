const { serializeTransaction } = require('viem');

// Zero amount transfer
const zeroAmountTx = {
  chainId: 1,
  nonce: 0,
  maxPriorityFeePerGas: BigInt('0x3b9aca00'), // 1 gwei
  maxFeePerGas: BigInt('0x6fc23ac00'), // 30 gwei
  gas: 21000n,
  to: '0x0987654321098765432109876543210987654321',
  value: 0n, // ZERO amount
  type: 'eip1559'
};

console.log('Zero amount RLP:', serializeTransaction(zeroAmountTx));

// Max uint256 amount
const maxUint256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
const maxAmountTx = {
  chainId: 1,
  nonce: 0,
  maxPriorityFeePerGas: BigInt('0x3b9aca00'),
  maxFeePerGas: BigInt('0x6fc23ac00'),
  gas: 21000n,
  to: '0x0987654321098765432109876543210987654321',
  value: BigInt(maxUint256),
  type: 'eip1559'
};

console.log('Max uint256 RLP:', serializeTransaction(maxAmountTx));

// Empty recipient (contract creation)
const contractCreationTx = {
  chainId: 1,
  nonce: 0,
  maxPriorityFeePerGas: BigInt('0x3b9aca00'),
  maxFeePerGas: BigInt('0x6fc23ac00'),
  gas: 21000n,
  to: null, // No recipient = contract creation
  value: BigInt('0xde0b6b3a7640000'), // 1 ETH
  data: '0x', // Empty data for test
  type: 'eip1559'
};

console.log('Contract creation RLP:', serializeTransaction(contractCreationTx));

// Self transfer
const selfTransferTx = {
  chainId: 1,
  nonce: 0,
  maxPriorityFeePerGas: BigInt('0x3b9aca00'),
  maxFeePerGas: BigInt('0x6fc23ac00'),
  gas: 21000n,
  to: '0x1234567890123456789012345678901234567890', // Same as sender
  value: BigInt('0xde0b6b3a7640000'), // 1 ETH
  type: 'eip1559'
};

console.log('Self transfer RLP:', serializeTransaction(selfTransferTx));