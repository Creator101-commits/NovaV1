# RefyneoV1 - AI-Powered Student Productivity Platform

RefyneoV1 is a comprehensive, AI-powered productivity platform designed specifically for students. It combines intelligent note-taking, calendar management, assignment tracking, and AI assistance to create a unified academic workspace.

![Architecture Diagram](images/software_architecture_diagram.png)

## System Architecture

RefyneoV1 follows a modern, cloud-native architecture designed for scalability, performance, and reliability. The system is built using a microservices approach with clear separation between frontend, backend, and data layers.

### Architecture Overview

The application architecture consists of six main components working together to deliver a seamless user experience:

**1. Front-End Deployment Layer**
- **Vercel**: Primary hosting platform for the React application, providing global CDN, automatic deployments, and serverless functions
- **Cloudflare**: Additional security layer offering DDoS protection, web application firewall (WAF), and performance optimization
- **Google Analytics**: User behavior tracking and application usage insights

**2. Front-End Technology Stack**
- **TypeScript**: Type-safe development ensuring code reliability and maintainability
- **Vite**: Lightning-fast build tool and development server for optimal developer experience
- **React**: Component-based UI framework for building interactive user interfaces
- **Tailwind CSS**: Utility-first CSS framework for rapid, consistent styling

**3. Authentication & External APIs**
- **Firebase SSO**: Secure authentication service supporting multiple login methods (Google, email/password)
- **Firebase SDK**: Client-side integration for real-time features and user management
- **Groq AI API**: Advanced AI capabilities for content summarization, chat assistance, and smart study recommendations
- **Google API Services**: Integration with Google Calendar, Classroom, and other productivity tools

**4. Back-End Technology Stack**
- **Node.js**: JavaScript runtime environment for server-side application logic
- **Express.js**: Minimalist web framework for building robust APIs and handling HTTP requests
- **Drizzle ORM**: Type-safe database toolkit for seamless database operations and migrations
- **WebSocket**: Real-time bidirectional communication for live updates and collaborative features

**5. Back-End Deployment Infrastructure**
- **Render**: Cloud platform hosting the Node.js backend with automatic scaling and deployment
- **Vercel Edge Network**: Global content delivery network ensuring low-latency API responses worldwide

**6. Database Layer**
- **Oracle Cloud Database**: Primary production database offering enterprise-grade reliability, security, and performance
- **PostgreSQL**: Development and backup database solution providing flexibility and local development support

### Data Flow Architecture

The system follows a unidirectional data flow pattern:

1. **User Interaction**: Users interact with the React frontend hosted on Vercel
2. **Authentication**: Firebase handles user authentication and session management
3. **API Communication**: Frontend communicates with the Express.js backend via RESTful APIs
4. **External Services**: Backend integrates with AI services (Groq) and Google APIs for enhanced functionality
5. **Data Persistence**: All application data is stored in Oracle Cloud Database with PostgreSQL as fallback
6. **Real-time Updates**: WebSocket connections enable live collaboration and instant notifications

### Infrastructure Benefits

**Scalability**: The architecture can handle growing user loads through cloud-native scaling
**Performance**: Global CDN and edge computing ensure fast response times worldwide  
**Reliability**: Multiple database options and cloud providers minimize downtime risk
**Security**: Multi-layered security with Cloudflare protection and Firebase authentication
**Developer Experience**: Modern tooling and TypeScript ensure maintainable, bug-free code
**Cost Efficiency**: Optimized use of free tiers and pay-as-you-scale pricing models

## Features

### Smart Note-Taking
- **Rich Text Editor**: Advanced note editor with formatting, tables, and task lists
- **Organization**: Categorize notes by type (lecture, homework, study, etc.)
- **Search & Filter**: Powerful search across all notes with category and class filters
- **Pinning System**: Pin important notes for quick access
- **Class Integration**: Link notes to specific classes for better organization

### Calendar & Scheduling
- **Unified Calendar**: View all events, assignments, and classes in one place
- **Google Calendar Sync**: Two-way synchronization with Google Calendar
- **Smart Scheduling**: AI-powered optimal study time suggestions
- **Event Management**: Create, edit, and manage calendar events
- **Assignment Integration**: Automatic due date tracking

### Assignment Management
- **Assignment Tracking**: Track homework, projects, and exams
- **Priority System**: Mark assignments by priority (low, medium, high)
- **Status Management**: Track completion status (pending, completed, overdue)
- **Class Integration**: Link assignments to specific classes
- **Due Date Alerts**: Never miss important deadlines

### AI-Powered Tools
- **AI Chat Assistant**: Get help with studying and academic questions
- **Content Summarization**: Summarize text, PDFs, and YouTube videos
- **Smart Study Planning**: AI-generated optimal study schedules
- **Learning Analytics**: Track progress and identify improvement areas

### Study Tools
- **Flashcards**: Create and study with spaced repetition
- **Pomodoro Timer**: Focus sessions with built-in timer
- **Mood Tracking**: Monitor academic stress and well-being
- **Daily Journal**: Reflect on your learning journey
- **Habit Tracking**: Build consistent study habits

### Analytics & Insights
- **Progress Tracking**: Visualize your academic progress
- **Study Analytics**: Understand your study patterns
- **Productivity Metrics**: Track time spent on different activities
- **Performance Insights**: Identify strengths and areas for improvement

## Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling with custom design system
- **Radix UI** for accessible component primitives
- **Framer Motion** for smooth animations
- **Wouter** for lightweight routing

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **Oracle Cloud Database** (primary) with PostgreSQL fallback
- **Firebase Authentication** for user management
- **RESTful API** with comprehensive endpoints

### Database
- **Oracle Cloud Database** (primary)
- **PostgreSQL** (fallback/development)
- **Comprehensive schema** for users, notes, assignments, classes, and more
- **Data migration support** between database systems

### Integrations
- **Google Calendar API** for calendar synchronization
- **Google Classroom API** for assignment import
- **Microsoft Graph API** for Outlook integration
- **Groq AI** for intelligent features
- **Firebase** for authentication and real-time features

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+
- Oracle Instant Client (for full database features)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Creator101-commits/RefyneoV1.git
   cd RefyneoV1
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Navigate to main application
   cd ProductivityHub/ProductivityHub
   
   # Install application dependencies
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in `ProductivityHub/ProductivityHub/`:
   ```env
   # Database Configuration
   ORACLE_USER=your_oracle_username
   ORACLE_PASSWORD=your_oracle_password
   ORACLE_CONNECTION_STRING=your_oracle_connection_string
   ORACLE_WALLET_PATH=./server/oracle_wallet
   
   # Alternative: PostgreSQL
   DATABASE_URL=postgresql://username:password@localhost:5432/refyneo
   
   # AI Services
   GROQ_API_KEY=your_groq_api_key
   
   # Firebase Configuration
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=123456789
   FIREBASE_APP_ID=1:123456789:web:abcdef
   
   # Google APIs
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google/callback
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

4. **Start Development Server**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start them separately
   npm run dev:client  # Frontend (port 5173)
   npm run dev:server  # Backend (port 5000)
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

## Usage

### Getting Started
1. **Sign Up/Login**: Use Firebase authentication to create your account
2. **Connect Google Calendar**: Link your Google Calendar for seamless integration
3. **Create Classes**: Add your courses and subjects
4. **Start Taking Notes**: Begin organizing your academic content
5. **Track Assignments**: Add homework and project deadlines
6. **Use AI Features**: Leverage AI for study help and content summarization

### Key Workflows
- **Daily Planning**: Check your calendar and upcoming assignments
- **Note-Taking**: Create and organize notes by class and category
- **Study Sessions**: Use flashcards and Pomodoro timer for focused study
- **Progress Review**: Check analytics to understand your learning patterns

## Development

### Project Structure
```
ProductivityHub/ProductivityHub/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (shadcn/ui)
│   │   ├── charts/         # Chart components
│   │   └── tools/          # Feature-specific components
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utility libraries
├── server/
│   ├── routes.ts           # API routes
│   ├── oracle-storage.ts   # Database operations
│   ├── oracle-database.ts  # Database connection
│   └── migrations/         # Database schemas
├── shared/
│   └── schema.ts           # Shared TypeScript schemas
└── docs/                   # Documentation
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

### Database Setup
1. **Oracle Cloud Database** (Recommended)
   - Create Oracle Cloud account
   - Set up Autonomous Database
   - Download wallet files
   - Configure connection strings

2. **PostgreSQL** (Alternative)
   - Install PostgreSQL locally
   - Create database named `refyneo`
   - Run migrations

## Configuration

### Google Calendar Integration
1. Enable Google Calendar API in Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add redirect URIs to authorized origins
4. Update environment variables

### AI Services Setup
1. **Groq AI**: Sign up for API key
2. **Firebase**: Create project and enable authentication
3. **Google APIs**: Enable Classroom and Calendar APIs

## API Documentation

The application provides a comprehensive REST API with endpoints for:
- User management and authentication
- Notes CRUD operations
- Assignment tracking
- Calendar event management
- AI-powered features
- Analytics and reporting

See [API Documentation](ProductivityHub/ProductivityHub/docs/API.md) for detailed endpoint information.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use conventional commit messages
- Write tests for new features
- Update documentation as needed

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: Check the [docs](ProductivityHub/ProductivityHub/docs/) folder
- **Issues**: Report bugs on [GitHub Issues](https://github.com/Creator101-commits/RefyneoV1/issues)
- **Discord**: Join our community for support
- **Email**: support@refyneo.com

## Roadmap

### Upcoming Features
- [ ] Mobile app (React Native)
- [ ] Offline support with sync
- [ ] Advanced AI tutoring
- [ ] Collaborative study groups
- [ ] Integration with more learning platforms
- [ ] Advanced analytics dashboard
- [ ] Custom study plans
- [ ] Voice notes and transcription

### Recent Updates
- Google Calendar integration
- AI-powered content summarization
- Advanced note organization
- Real-time collaboration features
- Comprehensive analytics

## Acknowledgments

- Built with [React](https://reactjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- Database operations with [Drizzle ORM](https://orm.drizzle.team/)
- AI integration with [Groq](https://groq.com/)

---

**RefyneoV1** - Empowering students with AI-driven productivity tools. 
