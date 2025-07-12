/**
 * Encryption System Test Suite
 * Tests the encryption service and middleware functionality
 */

const encryptionService = require('../lib/services/encryptionService');
const crypto = require('crypto');

// Test data
const testData = {
  simple: "Hello, World!",
  object: {
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correct: 1,
    points: 50
  },
  quiz: {
    questions: [
      {
        id: 1,
        question: "Test question 1",
        type: "truefalse",
        correct: true,
        points: 25
      },
      {
        id: 2,
        question: "Test question 2",
        type: "abcd",
        options: ["A", "B", "C", "D"],
        correct: 2,
        points: 25
      }
    ],
    totalPoints: 50
  }
};

// Test functions
function testBasicEncryption() {
  console.log('\n🔒 Testing Basic Encryption...');
  
  try {
    // Generate test key
    const key = encryptionService.generateSessionKey();
    console.log('✅ Generated session key:', key.length, 'bytes');
    
    // Test string encryption
    const encryptedString = encryptionService.encrypt(testData.simple, key);
    console.log('✅ Encrypted string data');
    
    const decryptedString = encryptionService.decrypt(encryptedString, key);
    console.log('✅ Decrypted string data:', decryptedString);
    
    if (decryptedString === testData.simple) {
      console.log('✅ String encryption/decryption successful');
    } else {
      console.error('❌ String encryption/decryption failed');
      return false;
    }
    
    // Test object encryption
    const encryptedObject = encryptionService.encrypt(testData.object, key);
    console.log('✅ Encrypted object data');
    
    const decryptedObject = encryptionService.decrypt(encryptedObject, key);
    console.log('✅ Decrypted object data');
    
    if (JSON.stringify(decryptedObject) === JSON.stringify(testData.object)) {
      console.log('✅ Object encryption/decryption successful');
    } else {
      console.error('❌ Object encryption/decryption failed');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Basic encryption test failed:', error);
    return false;
  }
}

function testSessionContext() {
  console.log('\n🔑 Testing Session Context...');
  
  try {
    const sessionId = 'test-session-123';
    const sessionSecret = 'test-secret-456';
    
    // Generate context
    const context = encryptionService.generateSessionContext(sessionId, sessionSecret);
    console.log('✅ Generated session context');
    
    // Validate context
    const isValid = encryptionService.isContextValid(context);
    console.log('✅ Context validation:', isValid);
    
    if (!isValid) {
      console.error('❌ Context validation failed');
      return false;
    }
    
    // Test encryption with context
    const encrypted = encryptionService.encrypt(testData.quiz, context.key);
    const decrypted = encryptionService.decrypt(encrypted, context.key);
    
    if (JSON.stringify(decrypted) === JSON.stringify(testData.quiz)) {
      console.log('✅ Session context encryption successful');
    } else {
      console.error('❌ Session context encryption failed');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Session context test failed:', error);
    return false;
  }
}

function testAPIEncryption() {
  console.log('\n📡 Testing API Encryption...');
  
  try {
    const key = encryptionService.generateSessionKey();
    
    // Test response encryption
    const encryptedResponse = encryptionService.encryptResponse(testData.quiz, key);
    console.log('✅ Encrypted API response');
    
    if (!encryptedResponse.encrypted || !encryptedResponse.data) {
      console.error('❌ Response encryption format invalid');
      return false;
    }
    
    // Test request decryption
    const decryptedRequest = encryptionService.decryptRequest(encryptedResponse, key);
    console.log('✅ Decrypted API request');
    
    if (JSON.stringify(decryptedRequest) === JSON.stringify(testData.quiz)) {
      console.log('✅ API encryption/decryption successful');
    } else {
      console.error('❌ API encryption/decryption failed');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ API encryption test failed:', error);
    return false;
  }
}

function testPerformance() {
  console.log('\n⚡ Testing Performance...');
  
  try {
    const key = encryptionService.generateSessionKey();
    const iterations = 1000;
    
    // Test encryption performance
    const startEncrypt = Date.now();
    for (let i = 0; i < iterations; i++) {
      encryptionService.encrypt(testData.object, key);
    }
    const encryptTime = Date.now() - startEncrypt;
    console.log(`✅ Encrypted ${iterations} objects in ${encryptTime}ms (${(encryptTime/iterations).toFixed(2)}ms per operation)`);
    
    // Test decryption performance
    const encrypted = encryptionService.encrypt(testData.object, key);
    const startDecrypt = Date.now();
    for (let i = 0; i < iterations; i++) {
      encryptionService.decrypt(encrypted, key);
    }
    const decryptTime = Date.now() - startDecrypt;
    console.log(`✅ Decrypted ${iterations} objects in ${decryptTime}ms (${(decryptTime/iterations).toFixed(2)}ms per operation)`);
    
    // Performance thresholds (should be fast enough for real-time use)
    const maxEncryptTime = 5; // 5ms per operation
    const maxDecryptTime = 5; // 5ms per operation
    
    if (encryptTime/iterations > maxEncryptTime) {
      console.warn(`⚠️ Encryption performance warning: ${(encryptTime/iterations).toFixed(2)}ms > ${maxEncryptTime}ms`);
    }
    
    if (decryptTime/iterations > maxDecryptTime) {
      console.warn(`⚠️ Decryption performance warning: ${(decryptTime/iterations).toFixed(2)}ms > ${maxDecryptTime}ms`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    return false;
  }
}

function testSecurity() {
  console.log('\n🛡️ Testing Security Features...');
  
  try {
    const key1 = encryptionService.generateSessionKey();
    const key2 = encryptionService.generateSessionKey();
    
    // Test that different keys produce different results
    const encrypted1 = encryptionService.encrypt(testData.simple, key1);
    const encrypted2 = encryptionService.encrypt(testData.simple, key2);
    
    if (encrypted1.encrypted === encrypted2.encrypted) {
      console.error('❌ Different keys produced same encrypted output');
      return false;
    }
    console.log('✅ Different keys produce different encrypted outputs');
    
    // Test that wrong key fails decryption
    try {
      encryptionService.decrypt(encrypted1, key2);
      console.error('❌ Wrong key should fail decryption');
      return false;
    } catch (error) {
      console.log('✅ Wrong key properly fails decryption');
    }
    
    // Test integrity verification
    const data = "test data";
    const hash = encryptionService.createIntegrityHash(data, key1);
    const isValid = encryptionService.verifyIntegrity(data, hash, key1);
    
    if (!isValid) {
      console.error('❌ Integrity verification failed');
      return false;
    }
    console.log('✅ Integrity verification successful');
    
    // Test tampered data detection
    const tamperedValid = encryptionService.verifyIntegrity("tampered data", hash, key1);
    if (tamperedValid) {
      console.error('❌ Tampered data not detected');
      return false;
    }
    console.log('✅ Tampered data properly detected');
    
    return true;
  } catch (error) {
    console.error('❌ Security test failed:', error);
    return false;
  }
}

// Run all tests
function runAllTests() {
  console.log('🧪 Starting Encryption System Tests...');
  
  const tests = [
    { name: 'Basic Encryption', fn: testBasicEncryption },
    { name: 'Session Context', fn: testSessionContext },
    { name: 'API Encryption', fn: testAPIEncryption },
    { name: 'Performance', fn: testPerformance },
    { name: 'Security', fn: testSecurity }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      if (test.fn()) {
        console.log(`✅ ${test.name} test PASSED`);
        passed++;
      } else {
        console.log(`❌ ${test.name} test FAILED`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} test FAILED with error:`, error.message);
      failed++;
    }
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All encryption tests passed! System is ready for deployment.');
    return true;
  } else {
    console.log('⚠️ Some tests failed. Please review and fix issues before deployment.');
    return false;
  }
}

// Export for use in other test files
module.exports = {
  runAllTests,
  testBasicEncryption,
  testSessionContext,
  testAPIEncryption,
  testPerformance,
  testSecurity
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}
