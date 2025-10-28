#!/usr/bin/env node

/**
 * Test script for Day 28 Price + Progress APIs
 * Run this after starting the dev server and logging in via UI
 */

const BASE_URL = 'http://localhost:3000';

// You'll need to get this from browser dev tools after logging in
const SESSION_COOKIE = 'app_session=YOUR_SESSION_COOKIE_HERE';

const headers = {
  'Cookie': SESSION_COOKIE,
  'Content-Type': 'application/json'
};

async function testEndpoint(method, url, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`${method} ${url}`);
  
  try {
    const response = await fetch(url, { method, headers });
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ SUCCESS');
    } else {
      console.log('❌ FAILED');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Day 28 API Tests');
  console.log('Make sure to:');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Log in via UI and get session cookie');
  console.log('3. Update SESSION_COOKIE in this script');
  console.log('4. Create a goal via UI to test progress endpoint');
  
  // Test current prices
  await testEndpoint(
    'GET',
    `${BASE_URL}/api/price/current?coins=BTC,ETH,SOL`,
    'Current prices for BTC, ETH, SOL'
  );
  
  // Test current prices with invalid coin
  await testEndpoint(
    'GET',
    `${BASE_URL}/api/price/current?coins=BTC,INVALID`,
    'Current prices with invalid coin (should fail)'
  );
  
  // Test current prices missing coins param
  await testEndpoint(
    'GET',
    `${BASE_URL}/api/price/current`,
    'Current prices missing coins param (should fail)'
  );
  
  // Test historical prices
  await testEndpoint(
    'GET',
    `${BASE_URL}/api/price/historical?coin=BTC&range=30d`,
    'Historical prices for BTC (30 days)'
  );
  
  // Test historical prices with invalid range
  await testEndpoint(
    'GET',
    `${BASE_URL}/api/price/historical?coin=BTC&range=7d`,
    'Historical prices with invalid range (should fail)'
  );
  
  // Test progress endpoint (you'll need a real goal ID)
  const goalId = 'YOUR_GOAL_ID_HERE';
  if (goalId !== 'YOUR_GOAL_ID_HERE') {
    await testEndpoint(
      'GET',
      `${BASE_URL}/api/progress/${goalId}`,
      'Progress for specific goal'
    );
  } else {
    console.log('\n⏭️  Skipping progress test - update goalId in script');
  }
  
  console.log('\n🎉 Tests completed!');
  console.log('\nNext steps:');
  console.log('1. Check cache behavior by calling current prices twice');
  console.log('2. Test with different coin combinations');
  console.log('3. Verify progress calculations match UI');
}

runTests().catch(console.error);
