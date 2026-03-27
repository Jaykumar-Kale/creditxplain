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
    console.log('Token:', token.substring(0, 40) + '...');

    // Get profile
    console.log('\nGetting user profile...');
    const profileRes = await makeRequest('GET', '/api/auth/me', null, token);
    console.log('Status:', profileRes.status);
    console.log('User:', profileRes.data.user);

    // Submit application
    console.log('\nSubmitting application...');
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
    console.log('Response:', JSON.stringify(appRes.data, null, 2));

    if (appRes.status === 201) {
      console.log('\nSCORING SUCCESSFUL!');
      console.log('Score:', appRes.data.result.creditScore);
      console.log('Decision:', appRes.data.result.decision);
      console.log('Risk Level:', appRes.data.result.riskLevel);

      const appId = appRes.data.applicationId;

      // Get application details
      console.log('\nFetching application details...');
      const detailRes = await makeRequest('GET', `/api/credit/${appId}`, null, token);
      console.log('Status:', detailRes.status);
      console.log('Application ID:', detailRes.data.application._id);
      console.log('Score:', detailRes.data.application.result.creditScore);
      console.log('What-if Scenarios:', detailRes.data.application.whatIfScenarios.length);

      // Get history
      console.log('\nFetching application history...');
      const historyRes = await makeRequest('GET', '/api/credit/history', null, token);
      console.log('Status:', historyRes.status);
      console.log('Total applications:', historyRes.data.applications?.length || 0);

      // Get stats
      console.log('\nFetching user statistics...');
      const statsRes = await makeRequest('GET', '/api/credit/stats', null, token);
      console.log('Status:', statsRes.status);
      if (statsRes.data.stats) {
        console.log('Stats:', statsRes.data.stats);
      } else {
        console.log('Error:', statsRes.data);
      }

      // Get bias report
      console.log('\nFetching bias report...');
      const biasRes = await makeRequest('GET', '/api/credit/bias-report', null, token);
      console.log('Status:', biasRes.status);
      if (biasRes.data.biasReport) {
        console.log('Bias Summary:', {
          totalApplications: biasRes.data.biasReport.summary.totalApplications,
          approved: biasRes.data.biasReport.summary.approvedCount,
          byGender: biasRes.data.biasReport.byGender
        });
      } else {
        console.log('Error:', biasRes.data);
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
