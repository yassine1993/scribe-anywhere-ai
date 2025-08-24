# TranscribeAI - AI-Powered Transcription Platform

A comprehensive web platform for AI-powered transcription of audio/video files with GPU acceleration, multiple processing modes, and enterprise-grade features.

## 🚀 Features

### Core Transcription
- **GPU-accelerated Whisper models** with ~99.8% accuracy
- **Three processing modes**:
  - 🐆 **Cheetah (Fast)**: ~95% accuracy, 2x faster
  - 🐬 **Dolphin (Balanced)**: ~98% accuracy, standard speed  
  - 🐋 **Whale (Accurate)**: ~99.8% accuracy, maximum quality
- **98+ spoken languages** supported with **130+ target languages** for translation
- **Audio restoration** for improved transcription quality
- **Speaker recognition** with automatic diarization

### File Support
- **Audio formats**: MP3, WAV, M4A, FLAC, AAC, OGG
- **Video formats**: MP4, MOV, AVI, MKV
- **Maximum file size**: 5GB per file
- **Export formats**: DOCX, PDF, TXT, CSV, SRT, VTT

### Pricing Tiers
- **Free Tier**: 3 × 30-minute transcriptions per day (low priority)
- **Unlimited Tier**: $10/month (annual) - unlimited transcriptions, high priority, batch processing

### Security & Privacy
- **End-to-end encryption** for all files and transcripts
- **JWT authentication** with secure password hashing
- **User isolation** - users can only access their own files
- **GDPR-compliant** data handling
- **HTTPS enforcement**

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + Python + SQLAlchemy
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **Queue System**: Redis + RQ for background processing
- **AI Models**: Faster Whisper + PyTorch
- **Authentication**: JWT + bcrypt
- **Payments**: Stripe integration
- **File Storage**: Encrypted local storage

## 📋 Prerequisites

- Python 3.8+
- Node.js 18+
- Redis server
- CUDA-capable GPU (optional, for acceleration)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd transcribeai
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export SECRET_KEY="your-secret-key-here"
export FERNET_KEY=$(python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
export STRIPE_SECRET_KEY="sk_test_your_stripe_key"
export STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Initialize database
python -c "from backend.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### 3. Frontend Setup
```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### 4. Start Redis
```bash
# Start Redis server
redis-server

# Or using Docker
docker run -d -p 6379:6379 redis:alpine
```

## 🚀 Running the Application

### Development Mode

#### Backend
```bash
# Terminal 1: Start FastAPI server
npm run server
# or
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start background worker
npm run worker
# or
python backend/worker.py
```

#### Frontend
```bash
# Terminal 3: Start React dev server
npm run dev
```

### Production Mode
```bash
# Build frontend
npm run build

# Start backend with production settings
uvicorn backend.main:app --host 0.0.0.0 --port 8000

# Start worker processes
python backend/worker.py 4  # Start 4 worker processes
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | JWT secret key | `changeme` |
| `FERNET_KEY` | Encryption key for files | Auto-generated |
| `DATABASE_URL` | Database connection string | `sqlite:///./app.db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `STRIPE_SECRET_KEY` | Stripe API secret key | `sk_test_dummy` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_dummy` |

### Stripe Setup

1. Create a Stripe account and get your API keys
2. Create a product and price for the $10/month subscription
3. Update the `SUBSCRIPTION_PRICE_ID` in `backend/payments.py`
4. Set up webhook endpoints for subscription events

## 📱 Usage

### 1. User Registration
- Visit the homepage and click "Start Free Trial"
- Create an account with email and password
- Verify your email (if enabled)

### 2. Upload Files
- Log in to your dashboard
- Drag & drop audio/video files or click to browse
- Choose processing mode (Cheetah/Dolphin/Whale)
- Select source language and optional target language
- Enable audio restoration and/or speaker recognition
- Click "Start Transcription"

### 3. Monitor Progress
- View job status in the "My Jobs" tab
- Real-time updates on processing status
- Download completed transcripts in multiple formats

### 4. Upgrade to Unlimited
- Click "Upgrade to Unlimited" in the header
- Complete Stripe checkout for $10/month
- Enjoy unlimited transcriptions with high priority

## 🔒 Security Features

- **File Encryption**: All uploaded files are encrypted using Fernet
- **Transcript Encryption**: Completed transcripts are encrypted before storage
- **JWT Tokens**: Secure authentication with configurable expiration
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse
- **Input Validation**: All user inputs are validated and sanitized
- **CORS Protection**: Configured CORS policies for security

## 🚀 Performance Optimization

### GPU Acceleration
- Install CUDA toolkit for GPU acceleration
- Models automatically use GPU if available
- Fallback to CPU if GPU is not available

### Queue Management
- Paid users get priority in transcription queues
- Background workers process jobs asynchronously
- Configurable worker processes for scaling

### Caching
- Whisper models are cached in memory
- Redis caching for job status and results
- Efficient file handling with streaming responses

## 🧪 Testing

### Backend Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest backend/tests/
```

### Frontend Tests
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📊 Monitoring & Logging

- **Structured logging** with configurable levels
- **Request/response logging** for API endpoints
- **Job progress tracking** with Redis
- **Error monitoring** and alerting
- **Performance metrics** collection

## 🔄 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### Transcription
- `POST /jobs/upload` - Upload files for transcription
- `GET /jobs` - List user's transcription jobs
- `GET /jobs/{job_id}` - Get job status
- `GET /jobs/{job_id}/transcript` - Download transcript
- `POST /jobs/export` - Bulk export transcripts
- `DELETE /jobs/{job_id}` - Delete job

### Payments
- `POST /stripe/create-checkout-session` - Create subscription
- `POST /stripe/webhook` - Handle Stripe events
- `GET /stripe/subscription-status` - Get subscription info

## 🚀 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Cloud Deployment
- **AWS**: Use ECS/Fargate with RDS and ElastiCache
- **Google Cloud**: Use Cloud Run with Cloud SQL and Memorystore
- **Azure**: Use Container Instances with Azure SQL and Redis Cache

### Environment Variables for Production
```bash
export DATABASE_URL="postgresql://user:pass@host:port/db"
export REDIS_URL="redis://host:port"
export SECRET_KEY="your-production-secret-key"
export STRIPE_SECRET_KEY="sk_live_your_key"
export STRIPE_WEBHOOK_SECRET="whsec_production_secret"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions

## 🎯 Roadmap

- [ ] Real-time transcription streaming
- [ ] Advanced audio preprocessing
- [ ] Custom vocabulary training
- [ ] Team collaboration features
- [ ] API rate limiting dashboard
- [ ] Advanced analytics and insights
- [ ] Mobile app development
- [ ] Enterprise SSO integration

---

Built with ❤️ for content creators, journalists, educators, and teams worldwide.
