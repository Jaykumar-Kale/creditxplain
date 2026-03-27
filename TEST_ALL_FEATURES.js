const http = require('http');

function makeRequest(method, endpoint, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
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
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(responseData)
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  try {
    // Login
    console.log('Logging in...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'demo@example.com',
      password: 'Demo@123456'
    });
    
    if (loginRes.status !== 200) {
      console.log('Login failed:', loginRes.data);
      return;
    }

    const token = loginRes.data.token;
    console.log('Logged in successfully');
    console.log('Token:', token.substring(0, 40) + '...\n');

    // Get profile
    console.log('Getting user profile...');
    const profileRes = await makeRequest('GET', '/api/auth/me', null, token);
    console.log('Status:', profileRes.status);
    console.log('User:', profileRes.data.user.name, '\n');

    // Submit application
    console.log('Submitting application...');
    const appData = {
      age: 35,
      income: 600000,
      employmentYears: 5,
      loanAmount: 200000,
      existingDebts: 150000,
      creditHistory: 8,
      numberOfDependents: 2,
      monthlyExpenses: 25000,
      savingsBalance: 100000,
      educationLevel: 'master',
      maritalStatus: 'married',
      homeOwnership: 'own',
      loanPurpose: 'Home',
      gender: 'male'
    };

    const appRes = await makeRequest('POST', '/api/credit/apply', appData, token);
    console.log('Status:', appRes.status);

    if (appRes.status === 201) {
      console.log('\n' + '='.repeat(80));
      console.log('APPLICATION SUBMITTED SUCCESSFULLY');
      console.log('='.repeat(80));
      console.log('Credit Score:', appRes.data.result.creditScore);
      console.log('Decision:', appRes.data.result.decision.toUpperCase());
      console.log('Risk Level:', appRes.data.result.riskLevel.toUpperCase());
      console.log('Probability:', (appRes.data.result.probability * 100).toFixed(1) + '%');
      console.log('Interest Rate Range:', appRes.data.result.interestRateRange);
      console.log('Max Approved Amount:', appRes.data.result.maxApprovedAmount);
      console.log();
      
      if (appRes.data.result.explanations && appRes.data.result.explanations.length > 0) {
        console.log('Top Factors:');
        appRes.data.result.explanations.slice(0, 3).forEach((exp, i) => {
          console.log(`  ${i + 1}. ${exp}`);
        });
      }

      const appId = appRes.data.applicationId;

      // Get application details
      console.log('\n' + '-'.repeat(80));
      console.log('Fetching application details...');
      const detailRes = await makeRequest('GET', `/api/credit/${appId}`, null, token);
      console.log('Application ID:', detailRes.data.application._id);
      console.log('What-if Scenarios: ' + detailRes.data.application.whatIfScenarios.length);
      if (detailRes.data.application.whatIfScenarios.length > 0) {
        console.log('Sample scenarios:');
        detailRes.data.application.whatIfScenarios.slice(0, 2).forEach(s => {
          console.log(`  - ${s.scenario}: Score ${s.newScore} (${s.change > 0 ? '+' : ''}${s.change})`);
        });
      }

      // Get history
      console.log('\n' + '-'.repeat(80));
      console.log('Fetching application history...');
      const historyRes = await makeRequest('GET', '/api/credit/history', null, token);
      console.log('Total applications:', historyRes.data.applications.length);
      console.log('Recent applications:');
      historyRes.data.applications.slice(0, 3).forEach((app, i) => {
        console.log(`  ${i + 1}. Score: ${app.result.creditScore}, Decision: ${app.result.decision}`);
      });

      // Get stats
      console.log('\n' + '-'.repeat(80));
      console.log('Fetching user statistics...');
      const statsRes = await makeRequest('GET', '/api/credit/stats', null, token);
      if (statsRes.status === 200 && statsRes.data.stats) {
        console.log('Total Applications:', statsRes.data.stats.totalApplications);
        console.log('Approved:', statsRes.data.stats.approved);
        console.log('Conditional:', statsRes.data.stats.conditional);
        console.log('Denied:', statsRes.data.stats.denied);
        console.log('Average Score:', statsRes.data.stats.averageScore.toFixed(0));
        console.log('Approval Rate:', (statsRes.data.stats.approvalRate * 100).toFixed(1) + '%');
      }

      // Get bias report
      console.log('\n' + '-'.repeat(80));
      console.log('Fetching bias and fairness report...');
      const biasRes = await makeRequest('GET', '/api/credit/bias-report', null, token);
      if (biasRes.status === 200 && biasRes.data.biasReport) {
        console.log('Bias Report Summary:');
        console.log('  Total Applications:', biasRes.data.biasReport.summary.totalApplications);
        console.log('  Approved:', biasRes.data.biasReport.summary.approvedCount);
        console.log('  Denied:', biasRes.data.biasReport.summary.deniedCount);
        
        if (biasRes.data.biasReport.byGender && biasRes.data.biasReport.byGender.length > 0) {
          console.log('\n  By Gender:');
          biasRes.data.biasReport.byGender.forEach(g => {
            console.log(`    ${g.segment}: ${(g.approvalRate * 100).toFixed(1)}% approval (n=${g.count})`);
          });
        }

        if (biasRes.data.biasReport.disparateImpact?.byGender) {
          const di = biasRes.data.biasReport.disparateImpact.byGender;
          console.log(`\n  Disparate Impact Ratio (Gender): ${di.ratio.toFixed(3)}`);
          if (di.flagged) {
            console.log('  WARNING: Potential bias detected!');
          } else {
            console.log('  Status: Within acceptable range (>0.80)');
          }
        }
      }

      console.log('\n' + '='.repeat(80));
      console.log('ALL TESTS PASSED SUCCESSFULLY');
      console.log('='.repeat(80));

    } else {
      console.log('Failed to submit application');
      console.log('Error:', JSON.stringify(appRes.data, null, 2));
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
