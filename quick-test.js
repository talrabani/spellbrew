const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  username: 'quicktest',
  password: 'testpass123'
};

class QuickTester {
  constructor() {
    this.token = null;
  }

  async login() {
    try {
      console.log('🔐 Logging in...');
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username: TEST_USER.username,
        password: TEST_USER.password
      });
      
      this.token = response.data.token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      console.log('✅ Login successful');
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️  User not found, creating new user...');
        return await this.createUser();
      }
      console.error('❌ Login failed:', error.response?.data?.error || error.message);
      return false;
    }
  }

  async createUser() {
    try {
      console.log('👤 Creating test user...');
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
        username: TEST_USER.username,
        email: 'quicktest@example.com',
        password: TEST_USER.password,
        displayName: 'Quick Test User'
      });
      
      this.token = response.data.token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      console.log('✅ User created successfully');
      return true;
    } catch (error) {
      console.error('❌ User creation failed:', error.response?.data?.error || error.message);
      return false;
    }
  }

  async getStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/progress`);
      const progress = response.data.progress;
      
      return {
        totalWords: progress.length,
        learningWords: progress.filter(p => p.learning_status === 'learning').length,
        reviewingWords: progress.filter(p => p.learning_status === 'reviewing').length,
        masteredWords: progress.filter(p => p.learning_status === 'mastered').length,
        averageStability: progress.reduce((sum, p) => sum + (p.fsrs_stability || 0), 0) / Math.max(progress.length, 1),
        averageDifficulty: progress.reduce((sum, p) => sum + (p.fsrs_difficulty || 5), 0) / Math.max(progress.length, 1)
      };
    } catch (error) {
      console.error('❌ Failed to get stats:', error.response?.data?.error || error.message);
      return null;
    }
  }

  async testAutoManage() {
    console.log('\n🔄 Testing auto-manage...');
    try {
      const response = await axios.post(`${API_BASE_URL}/progress/auto-manage`);
      console.log('✅ Auto-manage response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Auto-manage failed:', error.response?.data?.error || error.message);
      return null;
    }
  }

  async testWordSelection() {
    console.log('\n📝 Testing word selection...');
    try {
      const response = await axios.get(`${API_BASE_URL}/words/user?count=10`);
      console.log(`✅ Got ${response.data.words.length} words:`, response.data.words);
      return response.data.words;
    } catch (error) {
      console.error('❌ Word selection failed:', error.response?.data?.error || error.message);
      return [];
    }
  }

  async simulatePerfectSession() {
    console.log('\n🎯 Simulating perfect session (100% success)...');
    const words = await this.testWordSelection();
    if (words.length === 0) return;
    
    try {
      const results = words.map(word => ({ hebrew: word, correct: true }));
      const response = await axios.post(`${API_BASE_URL}/progress/batch`, { results });
      console.log('✅ Perfect session results submitted');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to submit perfect session:', error.response?.data?.error || error.message);
      return null;
    }
  }

  async simulatePoorSession() {
    console.log('\n💔 Simulating poor session (20% success)...');
    const words = await this.testWordSelection();
    if (words.length === 0) return;
    
    try {
      const results = words.map(word => ({ hebrew: word, correct: Math.random() < 0.2 }));
      const response = await axios.post(`${API_BASE_URL}/progress/batch`, { results });
      console.log('✅ Poor session results submitted');
      return response.data;
    } catch (error) {
      console.error('❌ Failed to submit poor session:', error.response?.data?.error || error.message);
      return null;
    }
  }

  async runTests() {
    console.log('🚀 Starting quick tests...');
    
    if (!await this.login()) {
      console.log('❌ Failed to authenticate');
      return;
    }
    
    // Test 1: Check initial state
    console.log('\n📊 Initial stats:');
    let stats = await this.getStats();
    if (stats) {
      console.log(`  Total: ${stats.totalWords}, Learning: ${stats.learningWords}, Reviewing: ${stats.reviewingWords}, Mastered: ${stats.masteredWords}`);
    }
    
    // Test 2: Auto-manage
    await this.testAutoManage();
    
    // Test 3: Check stats after auto-manage
    console.log('\n📊 Stats after auto-manage:');
    stats = await this.getStats();
    if (stats) {
      console.log(`  Total: ${stats.totalWords}, Learning: ${stats.learningWords}, Reviewing: ${stats.reviewingWords}, Mastered: ${stats.masteredWords}`);
    }
    
    // Test 4: Word selection
    await this.testWordSelection();
    
    // Test 5: Perfect session
    await this.simulatePerfectSession();
    
    // Test 6: Check stats after perfect session
    console.log('\n📊 Stats after perfect session:');
    stats = await this.getStats();
    if (stats) {
      console.log(`  Total: ${stats.totalWords}, Learning: ${stats.learningWords}, Reviewing: ${stats.reviewingWords}, Mastered: ${stats.masteredWords}`);
      console.log(`  Avg stability: ${stats.averageStability.toFixed(2)}, Avg difficulty: ${stats.averageDifficulty.toFixed(2)}`);
    }
    
    // Test 7: Poor session
    await this.simulatePoorSession();
    
    // Test 8: Final stats
    console.log('\n📊 Final stats:');
    stats = await this.getStats();
    if (stats) {
      console.log(`  Total: ${stats.totalWords}, Learning: ${stats.learningWords}, Reviewing: ${stats.reviewingWords}, Mastered: ${stats.masteredWords}`);
      console.log(`  Avg stability: ${stats.averageStability.toFixed(2)}, Avg difficulty: ${stats.averageDifficulty.toFixed(2)}`);
    }
    
    console.log('\n✅ Quick tests completed!');
  }
}

// Run the tests
async function main() {
  const tester = new QuickTester();
  await tester.runTests();
}

main().catch(console.error);
