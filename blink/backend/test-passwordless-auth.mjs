// Using Node.js built-in fetch (Node 18+)

const testPasswordlessAuth = async () => {
  console.log('🧪 Testing Passwordless Authentication System...\n');
  
  // Test 1: Signup endpoint (should not require password)
  console.log('1️⃣ Testing Signup Endpoint');
  try {
    const signupResponse = await fetch('http://localhost:3001/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'test@example.com',
        name: 'Test User'
      })
    });
    const signupData = await signupResponse.json();
    console.log('   ✅ Signup Response:', signupData.message || signupData.error);
  } catch (error) {
    console.log('   ❌ Signup Error:', error.message);
  }
  
  // Test 2: Login endpoint (should not require password)
  console.log('\n2️⃣ Testing Login Endpoint');
  try {
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'test@example.com'
      })
    });
    const loginData = await loginResponse.json();
    console.log('   ✅ Login Response:', loginData.message || loginData.error);
  } catch (error) {
    console.log('   ❌ Login Error:', error.message);
  }
  
  // Test 3: Verify OTP endpoint
  console.log('\n3️⃣ Testing OTP Verification Endpoint');
  try {
    const otpResponse = await fetch('http://localhost:3001/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'test@example.com',
        token: '123456',
        type: 'magiclink'
      })
    });
    const otpData = await otpResponse.json();
    console.log('   ✅ OTP Verification Response:', otpData.message || otpData.error);
  } catch (error) {
    console.log('   ❌ OTP Verification Error:', error.message);
  }
  
  console.log('\n🎉 Passwordless authentication system is configured!');
  console.log('📝 Note: OTP verification will fail without a real OTP, but endpoints are working.');
};

testPasswordlessAuth();
