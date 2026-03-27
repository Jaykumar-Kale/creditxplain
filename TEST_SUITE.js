#!/usr/bin/env node

/**
 * CreditXplain - Comprehensive Testing Script
 * Tests all features with demo users and sample data
 * Date: March 27, 2026
 */

const http = require('http');

const API_BASE = 'http://localhost:5000';
const DEMO_USERS = [
  {
    email: 'demo@example.com',
    name: 'Demo User',
    password: 'Demo@123456'
  },
  {
    email: 'test@example.com',
    name: 'Test User',
    password: 'Test@123456'
  }
];

const SAMPLE_APPLICATIONS = [
  {
    age: 35,
    income: 600000,
    employmentYears: 5,
    loanAmount: 200000,
    existingDebts: 150000,
    creditHistory: 8,
    numberOfDependents: 2,
    monthlyExpenses: 25000,
    savingsBalance: 100000,
    educationLevel: 'GRADUATE',
    maritalStatus: 'Married',
    homeOwnership: 'Owned',
    loanPurpose: 'Home'
  },
  {
    age: 28,
    income: 400000,
    employmentYears: 3,
    loanAmount: 100000,
    existingDebts: 50000,
    creditHistory: 6,
    numberOfDependents: 1,
    monthlyExpenses: 15000,
    savingsBalance: 50000,
    educationLevel: 'GRADUATE',
    maritalStatus: 'Single',
    homeOwnership: 'Rented',
    loanPurpose: 'Auto'
  },
  {
    age: 45,
    income: 800000,
    employmentYears: 10,
    loanAmount: 300000,
    existingDebts: 200000,
    creditHistory: 9,
    numberOfDependents: 3,
    monthlyExpenses: 35000,
    savingsBalance: 200000,
    educationLevel: 'POSTGRADUATE',
    maritalStatus: 'Married',
    homeOwnership: 'Owned',
    loanPurpose: 'Business'
  },
  {
    age: 25,
    income: 300000,
    employmentYears: 1,
    loanAmount: 80000,
    existingDebts: 40000,
    creditHistory: 4,
    numberOfDependents: 0,
    monthlyExpenses: 12000,
    savingsBalance: 30000,
    educationLevel: 'GRADUATE',
    maritalStatus: 'Single',
    homeOwnership: 'Rented',
    loanPurpose: 'Personal'
  },
  {
    age: 55,
    income: 1000000,
    employmentYears: 15,
    loanAmount: 400000,
    existingDebts: 300000,
    creditHistory: 10,
    numberOfDependents: 2,
    monthlyExpenses: 40000,
    savingsBalance: 300000,
    educationLevel: 'POSTGRADUATE',
    maritalStatus: 'Married',
    homeOwnership: 'Owned',
    loanPurpose: 'Home'
  }
];

// Utility to make HTTP requests
function makeRequest(method, endpoint, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test runner
async function runTests() {
  console.log('\\n' + '='.repeat(80));
  console.log('CreditXplain - Comprehensive Testing Suite');
  console.log('='.repeat(80) + '\\n');

  let tokens = {};
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  try {
    // Test 1: User Registration
    console.log('TEST 1: User Registration');
    console.log('-'.repeat(80));
    for (const user of DEMO_USERS) {
      try {
        const res = await makeRequest('POST', '/api/auth/register', user);
        if (res.status === 201 && res.data.success) {
          console.log(`✓ Registered: ${user.email}`);
          results.passed++;
        } else {
          console.log(`✗ Failed to register: ${user.email}`);
          results.failed++;
        }
        results.tests.push({
          test: `Register ${user.email}`,
          status: res.status === 201 ? 'PASS' : 'FAIL',
          details: res.data
        });
      } catch (err) {
        console.log(`✗ Error registering ${user.email}: ${err.message}`);
        results.failed++;
      }
    }
    console.log();

    // Test 2: User Login
    console.log('TEST 2: User Login & Token Generation');
    console.log('-'.repeat(80));
    for (const user of DEMO_USERS) {
      try {
        const res = await makeRequest('POST', '/api/auth/login', {
          email: user.email,
          password: user.password
        });
        if (res.status === 200 && res.data.token) {
          tokens[user.email] = res.data.token;
          console.log(`✓ Logged in: ${user.email}`);
          console.log(`  Token: ${res.data.token.substring(0, 30)}...`);
          results.passed++;
        } else {
          console.log(`✗ Failed to login: ${user.email}`);
          results.failed++;
        }
        results.tests.push({
          test: `Login ${user.email}`,
          status: res.status === 200 ? 'PASS' : 'FAIL'
        });
      } catch (err) {
        console.log(`✗ Error logging in ${user.email}: ${err.message}`);
        results.failed++;
      }
    }
    console.log();

    // Test 3: Get Current User
    console.log('TEST 3: Get Current User Profile');
    console.log('-'.repeat(80));
    for (const user of DEMO_USERS) {
      try {
        const token = tokens[user.email];
        const res = await makeRequest('GET', '/api/auth/me', null, token);
        if (res.status === 200 && res.data.user) {
          console.log(`✓ Retrieved profile: ${res.data.user.name} (${res.data.user.email})`);
          results.passed++;
        } else {
          console.log(`✗ Failed to get profile for ${user.email}`);
          results.failed++;
        }
        results.tests.push({
          test: `Get profile ${user.email}`,
          status: res.status === 200 ? 'PASS' : 'FAIL'
        });
      } catch (err) {
        console.log(`✗ Error getting profile: ${err.message}`);
        results.failed++;
      }
    }
    console.log();

    // Test 4: Submit Manual Applications
    console.log('TEST 4: Manual Credit Application Submission');
    console.log('-'.repeat(80));
    const firstUserToken = tokens[DEMO_USERS[0].email];
    const applicationIds = [];
    
    for (let i = 0; i < SAMPLE_APPLICATIONS.length; i++) {
      try {
        const res = await makeRequest('POST', '/api/credit/apply', SAMPLE_APPLICATIONS[i], firstUserToken);
        if (res.status === 201 && res.data.success) {
          applicationIds.push(res.data.applicationId);
          console.log(`✓ Application ${i + 1} submitted`);
          console.log(`  Score: ${res.data.result.creditScore}`);
          console.log(`  Decision: ${res.data.result.decision.toUpperCase()}`);
          console.log(`  Risk Level: ${res.data.result.riskLevel.toUpperCase()}`);
          results.passed++;
        } else {
          console.log(`✗ Failed to submit application ${i + 1}`);
          results.failed++;
        }
        results.tests.push({
          test: `Submit application ${i + 1}`,
          status: res.status === 201 ? 'PASS' : 'FAIL',
          score: res.data.result?.creditScore,
          decision: res.data.result?.decision
        });
      } catch (err) {
        console.log(`✗ Error submitting application: ${err.message}`);
        results.failed++;
      }
    }
    console.log();

    // Test 5: Get Application History
    console.log('TEST 5: Application History');
    console.log('-'.repeat(80));
    try {
      const res = await makeRequest('GET', '/api/credit/history', null, firstUserToken);
      if (res.status === 200 && Array.isArray(res.data.applications)) {
        console.log(`✓ Retrieved history: ${res.data.applications.length} applications`);
        res.data.applications.forEach((app, i) => {
          console.log(`  ${i + 1}. Score: ${app.result.creditScore}, Decision: ${app.result.decision}`);
        });
        results.passed++;
      } else {
        console.log(`✗ Failed to retrieve history`);
        results.failed++;
      }
      results.tests.push({
        test: 'Get application history',
        status: res.status === 200 ? 'PASS' : 'FAIL',
        count: res.data.applications?.length || 0
      });
    } catch (err) {
      console.log(`✗ Error retrieving history: ${err.message}`);
      results.failed++;
    }
    console.log();

    // Test 6: Get Single Application
    console.log('TEST 6: Get Single Application Details');
    console.log('-'.repeat(80));
    if (applicationIds.length > 0) {
      try {
        const res = await makeRequest('GET', `/api/credit/${applicationIds[0]}`, null, firstUserToken);
        if (res.status === 200 && res.data.application) {
          console.log(`✓ Retrieved application details`);
          console.log(`  Score: ${res.data.application.result.creditScore}`);
          console.log(`  Decision: ${res.data.application.result.decision}`);
          console.log(`  What-if Scenarios: ${res.data.application.whatIfScenarios.length}`);
          results.passed++;
        } else {
          console.log(`✗ Failed to retrieve application`);
          results.failed++;
        }
        results.tests.push({
          test: 'Get single application',
          status: res.status === 200 ? 'PASS' : 'FAIL'
        });
      } catch (err) {
        console.log(`✗ Error retrieving application: ${err.message}`);
        results.failed++;
      }
    }
    console.log();

    // Test 7: Get User Statistics
    console.log('TEST 7: User Statistics');
    console.log('-'.repeat(80));
    try {
      const res = await makeRequest('GET', '/api/credit/stats', null, firstUserToken);
      if (res.status === 200 && res.data.stats) {
        console.log(`✓ Retrieved statistics:`);
        console.log(`  Total Applications: ${res.data.stats.totalApplications}`);
        console.log(`  Approved: ${res.data.stats.approved}`);
        console.log(`  Conditional: ${res.data.stats.conditional}`);
        console.log(`  Denied: ${res.data.stats.denied}`);
        console.log(`  Average Score: ${res.data.stats.averageScore.toFixed(0)}`);
        console.log(`  Approval Rate: ${(res.data.stats.approvalRate * 100).toFixed(1)}%`);
        results.passed++;
      } else {
        console.log(`✗ Failed to retrieve statistics`);
        results.failed++;
      }
      results.tests.push({
        test: 'Get user statistics',
        status: res.status === 200 ? 'PASS' : 'FAIL'
      });
    } catch (err) {
      console.log(`✗ Error retrieving statistics: ${err.message}`);
      results.failed++;
    }
    console.log();

    // Test 8: Get Bias Report
    console.log('TEST 8: Fairness & Bias Report');
    console.log('-'.repeat(80));
    try {
      const res = await makeRequest('GET', '/api/credit/bias-report', null, firstUserToken);
      if (res.status === 200 && res.data.biasReport) {
        console.log(`✓ Retrieved bias report:`);
        console.log(`  Total Applications: ${res.data.biasReport.summary.totalApplications}`);
        console.log(`  Approved: ${res.data.biasReport.summary.approvedCount}`);
        
        if (res.data.biasReport.byGender) {
          console.log(`  By Gender:`);
          res.data.biasReport.byGender.forEach(g => {
            console.log(`    ${g.segment}: ${(g.approvalRate * 100).toFixed(1)}% approval rate`);
          });
        }
        
        if (res.data.biasReport.disparateImpact?.byGender) {
          console.log(`  Disparate Impact (Gender): ${res.data.biasReport.disparateImpact.byGender.ratio.toFixed(2)}`);
         if (res.data.biasReport.disparateImpact.byGender.flagged) {
            console.log(`    WARNING: Potential bias detected!`);
          }
        }
        results.passed++;
      } else {
        console.log(`✗ Failed to retrieve bias report`);
        results.failed++;
      }
      results.tests.push({
        test: 'Get bias report',
        status: res.status === 200 ? 'PASS' : 'FAIL'
      });
    } catch (err) {
      console.log(`✗ Error retrieving bias report: ${err.message}`);
      results.failed++;
    }
    console.log();

  } catch (err) {
    console.error('Test suite error:', err);
  }

  // Print Summary
  console.log('\\n' + '='.repeat(80));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Total:  ${results.passed + results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(80) + '\\n');

  return results;
}

// Run tests
runTests().catch(console.error);
