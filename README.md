# 🤖 Wortl Coach - AI German Language Learning Bot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Functions-blue.svg)](https://cloud.google.com/functions)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-blue.svg)](https://core.telegram.org/bots)

> An intelligent German language learning assistant that provides personalized feedback, practice exercises, and automated challenges to help C1/C2 speakers improve their business German skills.

## 🌟 Features

### 📝 **Smart Feedback System**
- **Text Analysis**: Get instant feedback on your German writing with style and word choice improvements
- **Voice Analysis**: Practice pronunciation with AI-powered speech recognition and targeted feedback
- **Phrase Extraction**: Automatically extracts and stores improvement suggestions for future practice

### 🎯 **Personalized Practice**
- **`/review`**: Generate exercises using your saved phrases from previous feedback
- **`/practice`**: Get general business-focused practice scenarios
- **Smart Prioritization**: Phrases are prioritized by importance and practice frequency with randomization

### 🤖 **Automated Engagement**
- **Weekly Challenges**: Receive 2 automated challenges per week at random times
- **Mixed Content**: Alternates between stored phrases and general scenarios
- **User Control**: Enable/disable automated challenges with `/challenges on/off`

### 📊 **Progress Tracking**
- **Practice Counters**: Track how many times each phrase has been practiced
- **Importance Ratings**: Mark phrases by importance (1-5 scale)
- **Category Organization**: Phrases are categorized by type (improvement, pronunciation, grammar)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Google Cloud Platform account
- Telegram Bot Token
- Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/wortl-coach.git
cd wortl-coach
npm install
```

### 2. Set Up Google Cloud

#### Create a New Project
```bash
# Install Google Cloud CLI
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

#### Enable Required APIs
```bash
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable speech.googleapis.com
gcloud services enable generativelanguage.googleapis.com
```

#### Create Service Account
```bash
gcloud iam service-accounts create telegram-bot-worker \
    --display-name="Telegram Bot Worker"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:telegram-bot-worker@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/datastore.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:telegram-bot-worker@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/speech.client"

gcloud iam service-accounts keys create gcp-credentials.json \
    --iam-account=telegram-bot-worker@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 3. Set Up Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Create a new bot: `/newbot`
3. Get your bot token
4. Set up webhook (optional for local development)

### 3.5. Find Your Telegram User ID

To get your Telegram user ID (needed for the `ALLOWED_USERS` environment variable):

1. Send any message to [@userinfobot](https://t.me/userinfobot) on Telegram
2. The bot will reply with your user information including your ID
3. Copy your user ID (it's a number like `123456789`)
4. Use this ID in your `ALLOWED_USERS` environment variable

### 4. Configure Environment Variables

Create a `.env` file in the project root:
```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Google Cloud Configuration
GCLOUD_PROJECT=your_google_cloud_project_id

# AI Services
GEMINI_API_KEY=your_gemini_api_key_here

# Security: Allowed users (comma-separated Telegram user IDs)
ALLOWED_USERS=your_telegram_user_id_here

# Optional: Google Cloud Credentials (for local development)
GOOGLE_APPLICATION_CREDENTIALS=./gcp-credentials.json

# Optional: Environment
NODE_ENV=development
```

**Important**: Never commit your `.env` file or `gcp-credentials.json` to version control!

**Security Note**: The `ALLOWED_USERS` environment variable contains sensitive personal information. Keep it secure and never expose it publicly.

### 5. Deploy to Google Cloud Functions

```bash
# Deploy the function
gcloud functions deploy telegramWebhook \
    --runtime nodejs18 \
    --trigger-http \
    --allow-unauthenticated \
    --entry-point telegramWebhook \
    --source . \
    --region us-central1

# Get the function URL
gcloud functions describe telegramWebhook --region us-central1 --format="value(httpsTrigger.url)"
```

### 6. Set Up Telegram Webhook

```bash
# Replace with your function URL
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
    -H "Content-Type: application/json" \
    -d '{"url": "YOUR_FUNCTION_URL"}'
```

## 📖 Usage

### Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Initialize the bot and enable automated challenges |
| `/help` | Show available commands |
| `/review` | Generate exercise using your saved phrases |
| `/practice` | Generate general practice exercise |
| `/challenges on` | Enable automated challenges |
| `/challenges off` | Disable automated challenges |
| `/challenges status` | Check challenge status |

### Message Types

- **Text Messages**: Get instant feedback on your German writing
- **Voice Messages**: Practice pronunciation with speech analysis

### Automated Challenges

The bot automatically sends challenges twice per week:
- **Review Challenges**: Use your saved phrases in context
- **Practice Challenges**: General business scenarios
- **Random Timing**: Between 9 AM - 8 PM
- **Smart Limits**: Maximum 4 challenges per week

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Telegram Bot  │───▶│  Google Cloud    │───▶│   Firestore     │
│                 │    │   Functions      │    │   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Gemini AI       │
                       │  Speech API      │
                       └──────────────────┘
```

### Key Components

- **`src/bot.js`**: Main bot logic and command handlers
- **`src/services.js`**: AI services (text analysis, speech recognition, exercise generation)
- **`src/scheduler.js`**: Automated challenge scheduling system
- **`src/handlers.js`**: Message and command handlers
- **`index.js`**: Google Cloud Functions entry point

## 🔒 Security

### User Access Control
This bot implements strict user access control to protect your personal data and Google Cloud billing:

- **Allowlist Protection**: Only users specified in `ALLOWED_USERS` environment variable can interact with the bot
- **No Hardcoded IDs**: User IDs are never stored in source code
- **Environment-Based**: All sensitive configuration is stored in environment variables
- **Silent Rejection**: Unauthorized users receive no response (no information leakage)

### Security Best Practices
- ✅ Never commit `.env` files to version control
- ✅ Use environment variables for all sensitive data
- ✅ Regularly rotate API keys and tokens
- ✅ Monitor unauthorized access attempts in logs
- ✅ Use least-privilege service accounts

## 🔧 Development

```bash
# Install dependencies
npm install

# Set up environment variables
export TELEGRAM_BOT_TOKEN=your_token
export GEMINI_API_KEY=your_key
export GCLOUD_PROJECT=your_project
export GOOGLE_APPLICATION_CREDENTIALS=./gcp-credentials.json

# Run locally
npm start
```

### Testing

```bash
# Test database functionality
node test-database.js

# Test automated challenges
node test-automated-challenges.js
```

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### **Speech Recognition Issues**

**Issue: "Invalid audio data" error**
- **Solution**: The bot automatically tries multiple audio configurations for Telegram voice messages
- **Check**: Ensure clear speech without background noise

**Issue: "Quota exceeded" error**
- **Solution**: Check your Google Cloud Speech-to-Text quota in the Google Cloud Console
- **Action**: Enable billing if not already done

**Issue: "Permission denied" error**
- **Solution**: Ensure your Cloud Run service has the necessary IAM permissions:
  ```bash
  gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:telegram-bot-worker@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/speech.client"
  ```

**Issue: Timeout errors**
- **Solution**: The bot has proper timeout handling and will suggest shorter messages
- **Tip**: Try with messages under 30 seconds first

#### **Environment Variables**

**Check these are properly set in your Cloud Run service:**
- `TELEGRAM_BOT_TOKEN`
- `GEMINI_API_KEY`
- `ALLOWED_USERS` (your Telegram user ID)
- `GCLOUD_PROJECT`

#### **API Permissions**

Your service account needs these permissions:
- `speech.googleapis.com` - Speech-to-Text API
- `aiplatform.googleapis.com` - Gemini API
- `firestore.googleapis.com` - Firestore

#### **Monitoring and Debugging**

**Check Cloud Run logs:**
```bash
gcloud logs tail --service=telegramwebhook --format="table(timestamp,severity,textPayload)"
```

**Test health endpoint:**
```bash
curl https://your-cloud-run-url/health
```

**Expected successful log output:**
```
Voice message received from user 123456: { fileId: '...', duration: 15, fileSize: 12345, mimeType: 'audio/ogg' }
Getting file link...
File link obtained: https://api.telegram.org/file/bot.../voice/file_123.ogg
Downloading audio file...
Audio downloaded: 12345 bytes
Starting speech analysis...
Speech recognition completed successfully
Final transcript: "Hallo, wie geht es dir?"
Speech analysis completed successfully
```

#### **If Issues Persist**

1. **Check Cloud Run logs** for specific error messages
2. **Verify your Google Cloud project** has all required APIs enabled
3. **Check billing** - ensure your project has billing enabled
4. **Test with a simple German audio file** to verify basic functionality
5. **Verify all environment variables** are correctly set

### Project Structure

```
wortl-coach/
├── src/
│   ├── bot.js              # Main bot configuration
│   ├── services.js         # AI and database services
│   ├── scheduler.js        # Automated challenge scheduler
│   ├── handlers.js         # Message handlers
│   └── config.js           # Configuration
├── index.js                # Cloud Functions entry point
├── package.json            # Dependencies
├── gcp-credentials.json    # Google Cloud credentials
└── README.md              # This file
```

## 🎯 Use Cases

### For Language Learners
- **Business German**: Improve professional communication skills
- **Pronunciation**: Practice with AI-powered speech analysis
- **Consistent Practice**: Automated challenges keep you engaged
- **Personalized Learning**: Focus on your specific improvement areas

### For Educators
- **Automated Tutoring**: Provide 24/7 language assistance
- **Progress Tracking**: Monitor student improvement over time
- **Personalized Feedback**: Tailored suggestions based on individual needs

### For Organizations
- **Employee Training**: Support German language development
- **Consistent Quality**: Standardized feedback and practice materials
- **Scalable Solution**: Handle multiple users simultaneously

## 🛣️ Roadmap

### Phase 1: Core Features ✅
- [x] Text analysis and feedback
- [x] Voice analysis and pronunciation feedback
- [x] Phrase storage and retrieval
- [x] Basic practice exercises

### Phase 2: Advanced Features ✅
- [x] Automated challenge system
- [x] Smart phrase prioritization
- [x] Progress tracking
- [x] User preferences

### Phase 3: Enhanced Learning (Planned)
- [ ] Grammar-specific exercises
- [ ] Industry-specific vocabulary
- [ ] Conversation practice scenarios
- [ ] Advanced pronunciation features

### Phase 4: Analytics & Insights (Planned)
- [ ] Learning analytics dashboard
- [ ] Progress reports
- [ ] Weakness identification
- [ ] Personalized learning paths

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Fork and clone
git clone https://github.com/yourusername/wortl-coach.git
cd wortl-coach

# Install dependencies
npm install

# Set up pre-commit hooks
npm run setup-hooks

# Run tests
npm test
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Cloud Platform** for hosting and AI services
- **Telegram** for the bot platform
- **Gemini AI** for natural language processing
- **Open Source Community** for inspiration and tools

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/wortl-coach/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/wortl-coach/discussions)
- **Email**: support@wortl-coach.com

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/wortl-coach&type=Date)](https://star-history.com/#yourusername/wortl-coach&Date)

---

**Made with ❤️ for German language learners worldwide**

If this project helps you improve your German, please consider giving it a ⭐! 