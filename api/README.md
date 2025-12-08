# Voice Notes API - NestJS Backend

Enterprise-grade backend API for a voice-first personal productivity application built with **NestJS**, **PostgreSQL**, **Redis**, and **OpenAI** integration.

## 🚀 Features

### Core Functionality
- **🎙️ Voice Processing Pipeline**: OpenAI Whisper transcription + GPT-4 analysis
- **🔐 JWT Authentication**: Secure auth with bcrypt password hashing
- **👥 User Management**: Registration, settings, onboarding tracking
- **📝 Task Management**: Priority-based tasks with deadline tracking
- **📊 Event-Driven Architecture**: Kafka/Bull queue system
- **🔍 Semantic Search**: pgvector embeddings for voice note search
- **📈 Analytics & Insights**: AI-powered pattern recognition

### Enterprise Architecture
- **🛡️ Security**: Helmet.js, rate limiting, CORS, input validation
- **📚 API Documentation**: Swagger/OpenAPI with detailed schemas  
- **⚡ Performance**: Redis caching, Bull queues, database indexing
- **🔄 Background Processing**: Async voice processing pipeline
- **📦 Modular Design**: Domain-driven module structure
- **🐳 Docker Ready**: Multi-stage builds for production deployment

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: NestJS with Express
- **Database**: PostgreSQL 15+ with pgvector extension
- **Cache/Queue**: Redis with Bull queues  
- **AI/ML**: OpenAI API (Whisper + GPT-4)
- **ORM**: TypeORM with migrations
- **Authentication**: JWT with Passport strategies
- **Validation**: class-validator with DTOs
- **Documentation**: Swagger/OpenAPI

### Module Structure
```
src/
├── auth/           # JWT authentication & authorization
├── users/          # User management & settings
├── voice-notes/    # Voice recording & AI processing
├── tasks/          # Task management & reminders
├── events/         # Event-driven system architecture
├── common/         # Shared utilities, filters, interceptors
├── config/         # Environment configuration
└── migrations/     # Database schema migrations
```

## 🔧 Installation & Setup

### Prerequisites
```bash
# Install Node.js 18+ and npm
node --version  # v18.0.0+
npm --version   # v8.0.0+

# Install PostgreSQL 15+ with pgvector
# Install Redis 6+
```

### Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Configure required variables
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=voice_notes_db

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

OPENAI_API_KEY=sk-your-openai-api-key

NODE_ENV=development
PORT=3001
```

### Install Dependencies
```bash
# Install all dependencies
npm install

# Install global CLI tools (optional)
npm install -g @nestjs/cli
```

### Database Setup
```bash
# Create database and enable extensions
createdb voice_notes_db

# Connect to database and enable pgvector
psql voice_notes_db
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Run Development Server
```bash
# Start in development mode with auto-reload
npm run start:dev

# Server will start at http://localhost:3001
# API docs available at http://localhost:3001/api/docs
# Health check at http://localhost:3001/health
```

## 📡 API Endpoints

### Authentication
```bash
POST /api/v1/auth/register     # User registration
POST /api/v1/auth/login        # User login
POST /api/v1/auth/refresh      # Refresh access token
DELETE /api/v1/auth/logout     # User logout
POST /api/v1/auth/profile      # Get current user profile
```

### Users
```bash
GET /api/v1/users/me           # Get current user
PATCH /api/v1/users/me         # Update user profile
PATCH /api/v1/users/me/settings # Update user settings
POST /api/v1/users/me/complete-onboarding # Complete onboarding
```

### Voice Notes
```bash
POST /api/v1/voice-notes       # Upload voice note (multipart/form-data)
GET /api/v1/voice-notes        # Get all user voice notes
GET /api/v1/voice-notes/:id    # Get specific voice note
PATCH /api/v1/voice-notes/:id  # Update voice note
DELETE /api/v1/voice-notes/:id # Delete voice note
GET /api/v1/voice-notes/search # Search voice notes
POST /api/v1/voice-notes/search/semantic # Semantic search
GET /api/v1/voice-notes/stats  # Processing statistics
```

### Tasks
```bash
POST /api/v1/tasks             # Create task
GET /api/v1/tasks              # Get all user tasks  
GET /api/v1/tasks/:id          # Get specific task
PATCH /api/v1/tasks/:id        # Update task
DELETE /api/v1/tasks/:id       # Delete task
PATCH /api/v1/tasks/:id/complete # Mark task complete
GET /api/v1/tasks/search       # Search tasks
GET /api/v1/tasks/stats        # Task statistics
```

### Events
```bash
GET /api/v1/events             # Get user events
GET /api/v1/events/:id         # Get specific event
GET /api/v1/events/stats       # Event statistics
```

## 🎙️ Voice Processing Pipeline

The voice processing system uses a sophisticated AI pipeline:

### 1. Audio Upload & Validation
- **Supported formats**: WAV, MP3, M4A, FLAC (max 50MB)
- **Validation**: MIME type checking, file size limits
- **Storage**: Local filesystem with unique file naming

### 2. Transcription (OpenAI Whisper)
```typescript
// Automatic speech recognition
const transcription = await openai.audio.transcriptions.create({
  file: audioFile,
  model: 'whisper-1',
  language: 'en',
  response_format: 'text',
  temperature: 0.2,
});
```

### 3. AI Analysis (GPT-4)
```typescript
// Extract insights, sentiment, entities, and action items
const analysis = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [
    { role: 'system', content: 'Analyze this voice note for productivity insights...' },
    { role: 'user', content: transcription }
  ],
});
```

### 4. Semantic Embedding (text-embedding-3-small)
```typescript
// Generate vector embeddings for semantic search
const embedding = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: transcription,
});
```

### 5. Database Storage
- **Transcription**: Full text with timestamps
- **Summary**: AI-generated key points (2-3 sentences)  
- **Title**: Auto-generated descriptive title (6 words max)
- **Tags**: Automatic categorization
- **Entities**: Extracted people, places, dates, tasks
- **Sentiment**: Score from -1 (negative) to 1 (positive)
- **Embeddings**: 1536-dimensional vectors for search
- **Insights**: Mood, urgency, topics, action items

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts and authentication
- **user_settings**: Preferences, consent, personalization
- **voice_notes**: Audio files, transcriptions, AI analysis
- **tasks**: Task management with priorities and deadlines
- **events**: System events for audit and analytics

### Key Indexes
```sql
-- Performance optimization
CREATE INDEX idx_voice_notes_user_id_created_at ON voice_notes (user_id, created_at);
CREATE INDEX idx_voice_notes_embedding_cosine ON voice_notes USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_tasks_user_id_status ON tasks (user_id, status);
CREATE INDEX idx_events_type_created_at ON events (type, created_at);
```

## 🔄 Background Processing

### Bull Queues
- **voice-processing**: Audio transcription and analysis
- **task-reminders**: Deadline notifications  
- **event-processing**: System event handling

### Processing Flow
```typescript
// 1. Queue job
await voiceProcessingQueue.add('process-voice-note', {
  voiceNoteId: savedVoiceNote.id,
});

// 2. Process in background
@Process('process-voice-note')
async processVoiceNote(job: Job) {
  // Transcribe → Analyze → Generate Embeddings → Update Database
}

// 3. Emit events
await eventsService.emit('voice_note_processed', {
  voiceNoteId,
  userId,
  insights,
});
```

## 🛡️ Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure stateless authentication
- **Password Hashing**: bcrypt with 12 rounds
- **Refresh Tokens**: Secure token renewal
- **Guards**: Route-level authorization

### Input Validation & Security
- **DTOs**: Type-safe request validation
- **Helmet.js**: Security headers
- **Rate Limiting**: API abuse prevention
- **CORS**: Cross-origin request control
- **Input Sanitization**: XSS/injection prevention

### Data Protection
- **Soft Deletes**: Data recovery capability
- **Audit Logging**: Complete action tracking
- **Error Handling**: Secure error responses
- **File Upload**: Size and type restrictions

## 📊 Monitoring & Observability

### Health Checks
```bash
# System health endpoint
GET /health
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

### Logging
- **Structured Logging**: JSON format for production
- **Request Tracing**: Correlation IDs for debugging
- **Error Tracking**: Detailed stack traces
- **Performance Metrics**: Response times and throughput

## 🧪 Testing

### Test Commands
```bash
# Unit tests
npm run test

# End-to-end tests  
npm run test:e2e

# Test coverage
npm run test:cov

# Test watch mode
npm run test:watch
```

### Test Structure
```
test/
├── unit/           # Unit tests for services/controllers
├── integration/    # Integration tests for modules
└── e2e/           # End-to-end API tests
```

## 🐳 Docker Deployment

### Development
```bash
# Start with docker-compose
docker-compose up -d

# Services included:
# - PostgreSQL with pgvector
# - Redis 
# - NestJS API server
```

### Production Build
```bash
# Multi-stage Docker build
docker build -t voice-notes-api .

# Run production container
docker run -p 3001:3001 voice-notes-api
```

## 🔧 Configuration

### Environment Variables
```bash
# Application
NODE_ENV=development|production
PORT=3001
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:pass@host:port/db
DATABASE_SSL=false

# Redis  
REDIS_URL=redis://host:port
REDIS_PASSWORD=

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_WHISPER_MODEL=whisper-1

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
```

## 📈 Performance Optimization

### Database Optimization
- **Indexes**: Strategic B-tree and vector indexes
- **Connection Pooling**: Efficient connection management  
- **Query Optimization**: Selective loading and joins
- **Migrations**: Version-controlled schema changes

### Caching Strategy
- **Redis Caching**: Frequently accessed data
- **Query Result Caching**: Expensive operations
- **Session Storage**: Distributed session management

### Background Processing
- **Queue Workers**: Async processing for CPU-intensive tasks
- **Rate Limiting**: Protect against API abuse
- **Bulk Operations**: Batch processing for efficiency

## 🤝 Contributing

### Development Workflow
```bash
# Create feature branch
git checkout -b feature/voice-analysis-enhancement

# Make changes and commit
git commit -m "feat: enhance voice sentiment analysis accuracy"

# Run tests
npm run test

# Submit pull request
```

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality gates

## 📚 Additional Resources

### Documentation
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

### Architecture Decisions
- [Voice Processing Pipeline Design](./docs/voice-processing-pipeline.md)
- [Database Schema Design](./docs/database-schema.md)  
- [Event-Driven Architecture](./docs/event-model.md)
- [Security Implementation](./docs/security-model.md)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 👥 Support

For support and questions:
- **Issues**: [GitHub Issues](https://github.com/your-org/voice-notes-api/issues)
- **Documentation**: [API Documentation](http://localhost:3001/api/docs)
- **Email**: support@your-domain.com

---

**Built with ❤️ using NestJS and modern enterprise patterns**