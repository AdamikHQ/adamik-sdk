#!/usr/bin/env ts-node

/**
 * Import Bruno Tests from Adamik API
 * 
 * This script reads Bruno test files from the adamik-api codebase and converts them
 * into test fixtures for the SDK. The SDK will independently verify these transactions
 * rather than trusting the API's assertions.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

interface BrunoTest {
  name: string;
  chainId: string;
  request: {
    transaction: {
      data: any;
    };
  };
  expectedEncoded: string;
}

interface SDKTestFixture {
  id: string;
  name: string;
  chainId: string;
  intent: any;
  encodedTransaction: string;
  source: string;
}

/**
 * Parse a .bru file to extract test data
 */
async function parseBruFile(filePath: string): Promise<BrunoTest | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Extract name
    const nameMatch = content.match(/name:\s*(.+)/);
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
    
    // Extract chainId
    const chainIdMatch = content.match(/chainId:\s*(.+)/);
    const chainId = chainIdMatch ? chainIdMatch[1].trim() : 'unknown';
    
    // Extract request body
    const bodyMatch = content.match(/body:json\s*{([\s\S]*?)^}/m);
    if (!bodyMatch) return null;
    
    // Clean up the JSON (remove extra braces)
    const jsonStr = bodyMatch[1].trim();
    const request = JSON.parse(jsonStr);
    
    // Extract expected encoded value
    const encodedMatch = content.match(/res\.body\.transaction\.encoded\[0\]\.raw\.value:\s*eq\s*(.+)/);
    const expectedEncoded = encodedMatch ? encodedMatch[1].trim() : '';
    
    return {
      name,
      chainId,
      request,
      expectedEncoded
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

/**
 * Convert Bruno test to SDK fixture
 */
function convertToSDKFixture(brunoTest: BrunoTest, sourcePath: string): SDKTestFixture {
  // Create a unique ID from the file path
  const id = sourcePath
    .replace(/.*\/bruno\//, '')
    .replace(/\.bru$/, '')
    .replace(/\//g, '-')
    .replace(/\s+/g, '-')
    .toLowerCase();
  
  return {
    id,
    name: brunoTest.name,
    chainId: brunoTest.chainId,
    intent: brunoTest.request.transaction.data,
    encodedTransaction: brunoTest.expectedEncoded,
    source: `bruno/${sourcePath.split('/bruno/')[1]}`
  };
}

/**
 * Main function to import Bruno tests
 */
async function importBrunoTests() {
  const BRUNO_TESTS_PATH = path.join(__dirname, '../../adamik-api/src/tests/bruno/encodeTransaction');
  const OUTPUT_PATH = path.join(__dirname, '../tests/fixtures/bruno-imported');
  
  console.log('🔍 Searching for Bruno tests in:', BRUNO_TESTS_PATH);
  
  // Find all .bru files
  const bruFiles = await glob('**/*.bru', { cwd: BRUNO_TESTS_PATH });
  console.log(`📁 Found ${bruFiles.length} Bruno test files`);
  
  // Create output directory
  await fs.mkdir(OUTPUT_PATH, { recursive: true });
  
  // Process each file
  const fixtures: SDKTestFixture[] = [];
  
  for (const file of bruFiles) {
    const filePath = path.join(BRUNO_TESTS_PATH, file);
    console.log(`  Processing: ${file}`);
    
    const brunoTest = await parseBruFile(filePath);
    if (brunoTest) {
      const fixture = convertToSDKFixture(brunoTest, file);
      fixtures.push(fixture);
    }
  }
  
  // Group fixtures by chain
  const fixturesByChain: Record<string, SDKTestFixture[]> = {};
  fixtures.forEach(fixture => {
    if (!fixturesByChain[fixture.chainId]) {
      fixturesByChain[fixture.chainId] = [];
    }
    fixturesByChain[fixture.chainId].push(fixture);
  });
  
  // Write fixtures to files
  for (const [chainId, chainFixtures] of Object.entries(fixturesByChain)) {
    const outputFile = path.join(OUTPUT_PATH, `${chainId}.json`);
    await fs.writeFile(outputFile, JSON.stringify(chainFixtures, null, 2));
    console.log(`✅ Wrote ${chainFixtures.length} fixtures to ${chainId}.json`);
  }
  
  // Write summary
  const summary = {
    generated: new Date().toISOString(),
    totalFixtures: fixtures.length,
    chains: Object.keys(fixturesByChain),
    source: 'adamik-api/src/tests/bruno/encodeTransaction'
  };
  
  await fs.writeFile(
    path.join(OUTPUT_PATH, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log('\n📊 Import Summary:');
  console.log(`  Total fixtures: ${fixtures.length}`);
  console.log(`  Chains: ${Object.keys(fixturesByChain).join(', ')}`);
  console.log(`  Output: ${OUTPUT_PATH}`);
}

// Run the import
if (require.main === module) {
  importBrunoTests().catch(console.error);
}

export { importBrunoTests, parseBruFile };