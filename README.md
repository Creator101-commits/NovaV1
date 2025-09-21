# RefyneoV1 - AI-Powered Productivity Hub

A comprehensive productivity application built with React, TypeScript, and Oracle Cloud Database. RefyneoV1 combines AI-powered features with traditional productivity tools to help students and professionals manage their tasks, notes, schedules, and learning materials.

## 🚀 Features

### 📝 **Core Productivity Tools**
- **Smart Notes** - Rich text editor with categorization and tagging
- **Flashcards** - Interactive study cards with spaced repetition
- **Daily Journal** - Personal reflection and goal tracking
- **Mood Tracker** - Emotional wellness monitoring
- **Pomodoro Timer** - Focus sessions with break management
- **Bell Schedule** - School/class schedule management

### 🤖 **AI-Powered Features**
- **AI Chat Assistant** - Powered by Groq AI for intelligent conversations
- **Text Summarization** - Summarize any text content instantly
- **Note Summarization** - AI-powered note analysis and key points extraction
- **YouTube Summarization** - Extract key insights from video transcripts
- **AI Summary History** - Track and manage all AI-generated summaries

### 📊 **Analytics & Insights**
- **Productivity Analytics** - Visual charts and progress tracking
- **Mood Trends** - Emotional pattern analysis
- **Study Progress** - Flashcard performance metrics
- **Time Tracking** - Pomodoro session analytics

### 🔗 **Integrations**
- **Google Classroom** - Sync assignments and classes
- **Google Calendar** - Event and schedule management
- **Microsoft Outlook** - Email and calendar integration
- **Notion** - Note and database synchronization
- **Anki** - Flashcard deck import/export

## 🛠️ Tech Stack

### **Frontend**
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **Framer Motion** - Smooth animations
- **TanStack Query** - Server state management
- **Wouter** - Lightweight routing

### **Backend**
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe server code
- **Oracle Cloud Database** - Primary database
- **PostgreSQL** - Alternative database support
- **Drizzle ORM** - Type-safe database queries
- **WebSockets** - Real-time communication

### **AI & External Services**
- **Groq AI** - AI chat and summarization
- **Firebase Authentication** - User management
- **Google APIs** - Classroom and Calendar integration
- **Microsoft Graph API** - Outlook integration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **Git** (latest version)
- **Oracle Instant Client** (for database connection)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Creator101-commits/RefyneoV1.git
cd RefyneoV1
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the `ProductivityHub/ProductivityHub` directory:

```env
# Database Configuration
ORACLE_USER=your_oracle_username
ORACLE_PASSWORD=your_oracle_password
ORACLE_CONNECTION_STRING=your_oracle_connection_string
ORACLE_WALLET_PATH=./server/oracle_wallet

# AI Services
GROQ_API_KEY=your_groq_api_key

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id

# Google APIs
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microsoft Graph
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# Notion Integration
NOTION_API_KEY=your_notion_api_key
```

### 4. Database Setup
1. Set up your Oracle Cloud Autonomous Database
2. Download the wallet files to `ProductivityHub/ProductivityHub/server/oracle_wallet/`
3. Run the database schema setup:
```bash
cd ProductivityHub/ProductivityHub
node server/setup-oracle-schema.cjs
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 📁 Project Structure

```
RefyneoV1/
├── ProductivityHub/
│   └── ProductivityHub/
│       ├── src/                    # Frontend source code
│       │   ├── components/         # React components
│       │   ├── pages/             # Page components
│       │   ├── contexts/          # React contexts
│       │   ├── lib/               # Utility libraries
│       │   └── hooks/             # Custom React hooks
│       ├── server/                # Backend source code
│       │   ├── routes.ts          # API routes
│       │   ├── oracle-storage.ts  # Database operations
│       │   ├── oracle-database.ts # Database connection
│       │   └── migrations/        # Database schemas
│       ├── shared/                # Shared types and schemas
│       ├── public/                # Static assets
│       └── docs/                  # Documentation
├── README.md                      # This file
└── package.json                   # Root package configuration
```

## 🎯 Usage

### **Getting Started**
1. **Sign Up/Login** - Create an account or sign in with Google
2. **Complete Setup** - Connect your external accounts (Google, Microsoft, etc.)
3. **Explore Features** - Navigate through the dashboard to access all tools

### **Key Features Usage**

#### **Smart Notes**
- Create rich text notes with categories and tags
- Organize notes by classes or subjects
- Pin important notes for quick access
- Search and filter notes efficiently

#### **AI Assistant**
- Ask questions and get intelligent responses
- Summarize text, notes, or YouTube videos
- Get study tips and productivity advice
- Track all AI interactions in history

#### **Flashcards**
- Create study cards with front/back content
- Set difficulty levels and track progress
- Use spaced repetition for optimal learning
- Import/export from Anki decks

#### **Productivity Tools**
- Track mood and emotional patterns
- Maintain daily journal entries
- Use Pomodoro timer for focused work sessions
- Manage class schedules and bell times

## 🔧 Development

### **Available Scripts**
```bash
# Development
npm run dev              # Start both client and server
npm run dev:client       # Start only frontend
npm run dev:server       # Start only backend

# Building
npm run build            # Build for production
npm run build:client     # Build only frontend
npm run build:server     # Build only backend

# Database
npm run db:setup         # Setup database schema
npm run db:test          # Test database connection
```

### **Code Style**
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add JSDoc comments for complex functions

### **Testing**
```bash
npm run test             # Run all tests
npm run test:client      # Run frontend tests
npm run test:server      # Run backend tests
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Contributing Guidelines**
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 API Documentation

### **Authentication Endpoints**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### **Notes Endpoints**
- `GET /api/users/:userId/notes` - Get user notes
- `POST /api/users/:userId/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### **Flashcards Endpoints**
- `GET /api/users/:userId/flashcards` - Get user flashcards
- `POST /api/users/:userId/flashcards` - Create flashcard
- `PUT /api/flashcards/:id` - Update flashcard
- `DELETE /api/flashcards/:id` - Delete flashcard

### **AI Endpoints**
- `POST /api/ai/chat` - AI chat conversation
- `POST /api/ai/summarize` - Text summarization
- `GET /api/users/:userId/ai-summaries` - Get AI summary history

For complete API documentation, see [API.md](docs/API.md).

## 🐛 Troubleshooting

### **Common Issues**

#### **Oracle Database Connection**
- Ensure Oracle Instant Client is installed
- Verify wallet files are in the correct location
- Check connection string and credentials

#### **Firebase Authentication**
- Verify Firebase configuration in `.env`
- Ensure Firebase project is properly set up
- Check Google OAuth settings

#### **AI Services**
- Verify API keys are correctly set
- Check API rate limits and quotas
- Ensure network connectivity

### **Getting Help**
- Check the [Issues](https://github.com/Creator101-commits/RefyneoV1/issues) page
- Review the [Documentation](docs/)
- Join our [Discord Community](https://discord.gg/refyneo)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq AI** for providing powerful AI capabilities
- **Oracle Cloud** for database infrastructure
- **shadcn/ui** for beautiful UI components
- **Vite** for excellent development experience
- **All Contributors** who help make this project better

## 📞 Support

- **Email**: support@refyneo.com
- **Discord**: [Join our community](https://discord.gg/refyneo)
- **GitHub Issues**: [Report bugs or request features](https://github.com/Creator101-commits/RefyneoV1/issues)

---

**Made with ❤️ by the Refyneo Team**

*Empowering productivity through AI and intelligent design.*