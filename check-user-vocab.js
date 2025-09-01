const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

class VocabChecker {
  constructor() {
    this.token = null;
  }

  async login(username, password) {
    try {
      console.log(`🔐 Logging in as ${username}...`);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      });
      
      this.token = response.data.token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      console.log('✅ Login successful');
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data?.error || error.message);
      return false;
    }
  }

  async checkUserVocab() {
    try {
      console.log('\n📚 Checking user vocabulary...');
      
      // Get all progress (existing words)
      const progressResponse = await axios.get(`${API_BASE_URL}/progress`);
      const progress = progressResponse.data.progress || [];
      
      console.log(`\n📊 User has ${progress.length} words in vocabulary:`);
      
      if (progress.length > 0) {
        console.log('\nFirst 10 words in vocabulary:');
        progress.slice(0, 10).forEach((word, index) => {
          console.log(`${index + 1}. ${word.hebrew} - Stage: ${word.word_stage}, Seen: ${word.times_seen}, Wrong: ${word.times_wrong}`);
        });
        
        if (progress.length > 10) {
          console.log('\nRemaining words in vocabulary:');
          progress.slice(10).forEach((word, index) => {
            console.log(`${index + 11}. ${word.hebrew} - Stage: ${word.word_stage}, Seen: ${word.times_seen}, Wrong: ${word.times_wrong}`);
          });
        }
      }
      
      // Get words for game
      console.log('\n🎮 Words selected for game:');
      const gameResponse = await axios.get(`${API_BASE_URL}/words/user?count=20`);
      const gameWords = gameResponse.data.words || [];
      const gameDetails = gameResponse.data.details || [];
      
      console.log(`Game selected ${gameWords.length} words:`);
      gameWords.forEach((word, index) => {
        const detail = gameDetails.find(d => d.hebrew === word);
        const stage = detail?.priority?.wordStage || 'unknown';
        console.log(`${index + 1}. ${word} - Stage: ${stage}`);
      });
      
      // Check if game words match vocabulary
      const vocabWords = progress.map(p => p.hebrew);
      const newWords = gameWords.filter(word => !vocabWords.includes(word));
      const existingWords = gameWords.filter(word => vocabWords.includes(word));
      
      console.log(`\n📈 Analysis:`);
      console.log(`- Total vocabulary words: ${vocabWords.length}`);
      console.log(`- Words in game: ${gameWords.length}`);
      console.log(`- Existing words in game: ${existingWords.length}`);
      console.log(`- New words in game: ${newWords.length}`);
      
      if (newWords.length > 0) {
        console.log(`\n🆕 New words added to game: ${newWords.join(', ')}`);
      }
      
      // Check for missing words
      const missingFromGame = vocabWords.filter(word => !gameWords.includes(word));
      if (missingFromGame.length > 0) {
        console.log(`\n❌ Words in vocabulary but NOT in game: ${missingFromGame.join(', ')}`);
      }
      
      return {
        vocabCount: vocabWords.length,
        gameCount: gameWords.length,
        existingInGame: existingWords.length,
        newInGame: newWords.length,
        missingFromGame: missingFromGame.length
      };
      
    } catch (error) {
      console.error('❌ Error checking vocabulary:', error.response?.data || error.message);
      return null;
    }
  }

  async runCheck(username, password) {
    console.log('🚀 Starting vocabulary check...');
    
    if (!await this.login(username, password)) {
      console.log('❌ Failed to authenticate');
      return;
    }
    
    await this.checkUserVocab();
    
    console.log('\n✅ Vocabulary check completed!');
  }
}

// Get username and password from command line arguments
const username = process.argv[2] || 'debugtest';
const password = process.argv[3] || 'testpass123';

console.log(`Checking vocabulary for user: ${username}`);

// Run the check
async function main() {
  const checker = new VocabChecker();
  await checker.runCheck(username, password);
}

main().catch(console.error);
