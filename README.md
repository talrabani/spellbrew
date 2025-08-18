# Spellbrew - Hebrew Speed Spelling Challenge

A web application designed to improve Hebrew reading and writing speed through interactive spelling challenges.

## About

Spellbrew is a speed-based spelling game that helps users enhance their Hebrew literacy skills. As someone who is fluent in conversational Hebrew but struggles with reading and writing speed, I created this app to practice and improve my Hebrew spelling abilities in an engaging, game-like format.

## Features

- **Speed Spelling Challenges**: Test how many Hebrew words you can spell per minute
- **User Authentication**: Create accounts, track progress, and save scores
- **Progressive Learning**: Level up system with experience points
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Real-time Feedback**: Instant visual feedback for correct/incorrect answers
- **Review System**: Option to review mistakes and learn from them
- **Hebrew Vocabulary Database**: Comprehensive collection of Hebrew words with English translations

## Tech Stack

### Frontend
- **React** - Modern UI framework
- **Vite** - Fast build tool and development server
- **Axios** - HTTP client for API communication
- **CSS3** - Styling with responsive design

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/spellbrew.git
   cd spellbrew
   ```

2. **Set up the database**
   ```bash
   cd server
   cp env.example .env
   # Edit .env with your database credentials
   npm run init-db
   ```

3. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

4. **Start the development servers**
   ```bash
   # Start the backend server (from server directory)
   npm start
   
   # Start the frontend development server (from client directory)
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173 (or the port shown in terminal)
   - Backend API: http://localhost:5000

## Game Flow

1. **Sign up/Login** - Create an account or sign in
2. **Start Challenge** - Click "Start Speed Test" to begin
3. **Memorize** - Hebrew words are displayed briefly for memorization
4. **Spell** - Type the Hebrew word you remember
5. **Get Feedback** - Instant visual feedback (green checkmark for correct, red X for incorrect)
6. **Review** - Option to review mistakes during the countdown
7. **Track Progress** - View your score, words per minute, and level up

## Database Schema

- **users** - User accounts and profiles
- **vocabulary** - Hebrew words with English translations and transliterations
- **scores** - Game scores and performance metrics
- **sessions** - User session tracking

## Contributing

This is a personal project, but suggestions and feedback are welcome! Feel free to open issues or submit pull requests.

## License

This project is open source and available under the [MIT License](LICENSE).

## Personal Motivation

As a Hebrew speaker who is fluent in conversation but struggles with reading and writing speed, I created Spellbrew to address this specific challenge. The app provides a structured, engaging way to practice Hebrew spelling and improve literacy skills through gamification and real-time feedback.

---

*Built with ❤️ for Hebrew learners everywhere*
