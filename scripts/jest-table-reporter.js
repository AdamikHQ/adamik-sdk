const { DefaultReporter } = require('@jest/reporters');

class TableReporter extends DefaultReporter {
  constructor(globalConfig, reporterOptions, reporterContext) {
    super(globalConfig, reporterOptions, reporterContext);
  }

  onRunComplete(testContexts, results) {
    super.onRunComplete(testContexts, results);
    
    console.log('\n' + '='.repeat(100));
    console.log('TEST SUMMARY TABLE');
    console.log('='.repeat(100));
    
    // Overall Summary
    const { numTotalTests, numPassedTests, numFailedTests, numPendingTests, numTodoTests, numTotalTestSuites } = results;
    const passRate = numTotalTests > 0 ? ((numPassedTests / numTotalTests) * 100).toFixed(1) : '0.0';
    
    console.log('\nOVERALL RESULTS:');
    console.log('-'.repeat(50));
    console.log(`Total Suites:  ${numTotalTestSuites}`);
    console.log(`Total Tests:   ${numTotalTests}`);
    console.log(`✅ Passed:     ${numPassedTests} (${passRate}%)`);
    console.log(`❌ Failed:     ${numFailedTests}`);
    console.log(`⏭️  Skipped:    ${numPendingTests}`);
    console.log(`📝 Todo:       ${numTodoTests}`);
    console.log(`⏱️  Duration:   ${((results.startTime ? Date.now() - results.startTime : 0) / 1000).toFixed(2)}s`);
    
    // Test Suite Details
    console.log('\n' + '-'.repeat(100));
    console.log('TEST SUITE BREAKDOWN:');
    console.log('-'.repeat(100));
    console.log(
      'Suite'.padEnd(40) + 
      'Total'.padEnd(8) + 
      'Pass'.padEnd(8) + 
      'Fail'.padEnd(8) + 
      'Skip'.padEnd(8) + 
      'Time'.padEnd(8) +
      'Status'
    );
    console.log('-'.repeat(100));
    
    const suiteDetails = [];
    
    results.testResults.forEach(suite => {
      const suiteName = suite.testFilePath.split('/').pop();
      const status = suite.numFailingTests > 0 ? '❌ FAIL' : '✅ PASS';
      const duration = ((suite.perfStats.end - suite.perfStats.start) / 1000).toFixed(2) + 's';
      
      // Count actual test results
      let totalTests = 0;
      let passedTests = 0;
      let failedTests = 0;
      let skippedTests = 0;
      
      suite.testResults.forEach(test => {
        totalTests++;
        if (test.status === 'passed') passedTests++;
        else if (test.status === 'failed') failedTests++;
        else if (test.status === 'pending' || test.status === 'skipped') skippedTests++;
      });
      
      suiteDetails.push({
        name: suiteName,
        total: totalTests,
        pass: passedTests,
        fail: failedTests,
        skip: skippedTests,
        duration,
        status
      });
      
      console.log(
        suiteName.padEnd(40) +
        totalTests.toString().padEnd(8) +
        passedTests.toString().padEnd(8) +
        failedTests.toString().padEnd(8) +
        skippedTests.toString().padEnd(8) +
        duration.padEnd(8) +
        status
      );
    });
    
    // Blockchain-specific Summary
    const blockchainStats = {
      bitcoin: { total: 0, pass: 0, fail: 0, skip: 0 },
      evm: { total: 0, pass: 0, fail: 0, skip: 0 },
      other: { total: 0, pass: 0, fail: 0, skip: 0 }
    };
    
    results.testResults.forEach(suite => {
      suite.testResults.forEach(test => {
        const testPath = test.ancestorTitles.concat(test.title).join(' ').toLowerCase();
        let category = 'other';
        
        if (testPath.includes('bitcoin') || testPath.includes('btc')) {
          category = 'bitcoin';
        } else if (testPath.includes('evm') || testPath.includes('ethereum') || testPath.includes('polygon')) {
          category = 'evm';
        }
        
        blockchainStats[category].total++;
        if (test.status === 'passed') {
          blockchainStats[category].pass++;
        } else if (test.status === 'failed') {
          blockchainStats[category].fail++;
        } else if (test.status === 'pending' || test.status === 'skipped') {
          blockchainStats[category].skip++;
        }
      });
    });
    
    console.log('\n' + '-'.repeat(100));
    console.log('BLOCKCHAIN-SPECIFIC BREAKDOWN:');
    console.log('-'.repeat(100));
    console.log('Chain'.padEnd(20) + 'Total'.padEnd(10) + 'Pass'.padEnd(10) + 'Fail'.padEnd(10) + 'Skip'.padEnd(10) + 'Pass Rate');
    console.log('-'.repeat(100));
    
    Object.entries(blockchainStats).forEach(([chain, stats]) => {
      const passRate = stats.total > 0 ? ((stats.pass / stats.total) * 100).toFixed(1) : '0.0';
      console.log(
        chain.toUpperCase().padEnd(20) +
        stats.total.toString().padEnd(10) +
        stats.pass.toString().padEnd(10) +
        stats.fail.toString().padEnd(10) +
        stats.skip.toString().padEnd(10) +
        passRate + '%'
      );
    });
    
    // Show specific test details for run tests only
    const runTests = [];
    results.testResults.forEach(suite => {
      suite.testResults.forEach(test => {
        if (test.status === 'passed' || test.status === 'failed') {
          runTests.push({
            suite: suite.testFilePath.split('/').pop(),
            test: test.ancestorTitles.concat(test.title).join(' > '),
            status: test.status,
            duration: test.duration || 0
          });
        }
      });
    });
    
    if (runTests.length > 0) {
      console.log('\n' + '-'.repeat(100));
      console.log('EXECUTED TESTS:');
      console.log('-'.repeat(100));
      runTests.forEach((test, index) => {
        const icon = test.status === 'passed' ? '✅' : '❌';
        console.log(`${icon} [${test.suite}] ${test.test} (${test.duration}ms)`);
      });
    }
    
    // Individual Test Details (only failures)
    const failedTests = [];
    results.testResults.forEach(suite => {
      suite.testResults.forEach(test => {
        if (test.status === 'failed') {
          failedTests.push({
            suite: suite.testFilePath.split('/').pop(),
            test: test.ancestorTitles.concat(test.title).join(' > '),
            error: test.failureMessages[0]?.split('\n')[0] || 'Unknown error'
          });
        }
      });
    });
    
    if (failedTests.length > 0) {
      console.log('\n' + '-'.repeat(100));
      console.log('FAILED TESTS:');
      console.log('-'.repeat(100));
      failedTests.forEach((test, index) => {
        console.log(`${index + 1}. [${test.suite}] ${test.test}`);
        console.log(`   Error: ${test.error.substring(0, 80)}${test.error.length > 80 ? '...' : ''}`);
      });
    }
    
    console.log('='.repeat(100) + '\n');
  }
}

module.exports = TableReporter;