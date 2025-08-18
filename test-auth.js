const axios = require('axios');

// Test user creation and login
async function testAuth() {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('Testing user registration...');
    
    // Create a test user
    const signupResponse = await axios.post(`${baseURL}/auth/signup`, {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User'
    });
    
    console.log('User created successfully!');
    console.log('Token:', signupResponse.data.token);
    console.log('User data:', signupResponse.data.user);
    
    // Test login
    console.log('\nTesting login...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      username: 'testuser',
      password: 'password123'
    });
    
    console.log('Login successful!');
    console.log('Token:', loginResponse.data.token);
    
    // Test profile fetch
    console.log('\nTesting profile fetch...');
    const profileResponse = await axios.get(`${baseURL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });
    
    console.log('Profile fetched successfully!');
    console.log('Profile:', profileResponse.data.user);
    
    console.log('\n✅ All tests passed! You can now use this token in localStorage:');
    console.log(`localStorage.setItem('authToken', '${loginResponse.data.token}')`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAuth();
