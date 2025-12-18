# AI Text Summarizer

A modern, responsive web application that uses advanced AI models to summarize text content in real-time. Built with React, Express, and powered by Cohere AI and DistilBART for intelligent text summarization.

![React](https://img.shields.io/badge/React-19.1.1-blue?logo=react)
![Express](https://img.shields.io/badge/Express-5.1.0-black?logo=express)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-8.16.3-blue?logo=postgresql)

## 🌐 Live Deployment

- **Frontend**: https://ai-platform-three-phi.vercel.app/
- **Backend**: https://ai-text-summarizer-9lix.onrender.com/

## 🚀 Features

- **AI-Powered Summarization**: Leverages Cohere AI's latest command models for high-quality summaries, with DistilBART as a fallback
- **Session-Based Authentication**: Secure login and signup with Express sessions, bcrypt password hashing, and PostgreSQL storage
- **Persistent Login**: Stay logged in across browser sessions with automatic session management
- **User Profiles**: Display first letter of username in a circular avatar
- **Real-time Typing Animation**: Smooth character-by-character display of AI-generated summaries
- **Responsive Design**: Mobile-first design with Tailwind CSS for seamless experience across devices
- **Dark/Light Theme**: Toggle between themes with persistent localStorage
- **Input Validation**: Minimum 20-word requirement with special keyword recognition
- **Special Queries**: Ask "whoami", "what's your name?", or similar questions to reveal the AI's identity
- **Loading States**: Visual feedback during AI processing with animated spinner
- **Social Authentication**: Full Google OAuth 2.0 integration with Passport.js

## 🛠️ Tech Stack

### Frontend

- **React 19** - Modern JavaScript library for building user interfaces
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Declarative routing for React
- **FontAwesome** - Icon library for UI elements

### Backend

- **Express.js** - Web application framework for Node.js
- **JavaScript (ES6+)** - Server-side scripting language
- **PostgreSQL** - Advanced open-source relational database
- **bcrypt** - Password hashing library
- **CORS** - Cross-Origin Resource Sharing support

### AI Services

- **Cohere AI** - Primary AI model for text summarization
- **Hugging Face Inference** - Fallback AI model (DistilBART)

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **PostgreSQL** database
- API keys for:
  - Cohere AI (`CO_API_KEY`)
  - Hugging Face (`HF_TOKEN`)

## 🔧 Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Makky101/AI-Text-Summarizer.git
   cd AI-Text-Summarizer
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Database Configuration
   DB_USER=your_db_username
   HOST=localhost
   DB=your_database_name
   PASSWORD=your_db_password
   PORT=5432

   # AI API Keys
   CO_API_KEY=your_cohere_api_key
   HF_TOKEN=your_huggingface_token

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Security
   BCRYPT_SALT_ROUNDS=12
   SESSION_SECRET=your_random_session_secret_string
   ```

4. **Database Setup:**
   Create a PostgreSQL database and run the following SQL to create the users table:
   ```sql
   CREATE TABLE credentials (
       id SERIAL PRIMARY KEY,
       username VARCHAR(255) UNIQUE NOT NULL,
       f_letter VARCHAR(1) NOT NULL,
       email VARCHAR(255) UNIQUE NOT NULL,
       hashpassword VARCHAR(255) NULL
   );
   ```
   Note: `hashpassword` is NULL for Google OAuth users.

5. **Google OAuth Setup (Optional):**
   To enable Google authentication:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Create OAuth 2.0 credentials (Client ID and Client Secret)
   - Add `http://localhost:3000/auth/google/callback` as an authorized redirect URI
   - Add your Client ID and Client Secret to the `.env` file

## 🚀 Running the Application

### Development Mode

1. **Start the backend server:**

   ```bash
   npm run dev-server
   ```

   This runs the TypeScript server with auto-reload using nodemon.

2. **Start the frontend (in a new terminal):**
   ```bash
   npm run dev
   ```
   Opens the development server at `http://localhost:5173`

### Production Mode

1. **Build the frontend:**

   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm start
   ```
   This runs the compiled JavaScript server.

## 📖 Usage

1. **Access the application** at `http://localhost:5173`
2. **Sign up** for a new account, **login** with existing credentials, or use **Google authentication**
3. **Enter text** to summarize (minimum 20 words required)
4. **Click "Enter"** to generate an AI summary
5. **Toggle theme** using the sun/moon icon in the header
6. **Try the easter egg**: Type questions like "what's your name?" or "who built you?"

## 🏗️ Project Structure

```
src/
├── AI_logic/
│   └── AI_server.js          # Express server with AI integration
├── components/
│   ├── Authentication/
│   │   ├── auth.jsx           # Login/Signup component
│   │   └── auth.css           # Authentication styles
│   ├── User Interface/
│   │   ├── Main_Page.jsx      # Main summarization interface
│   │   ├── UI.css             # Main UI styles
│   │   └── resp.css           # Responsive styles
│   └── names.js               # Special keyword list
├── App.jsx                    # Main React component
├── index.css                  # Global styles
└── main.jsx                   # React entry point
```

## 🔄 API Endpoints

### Authentication
- `GET /check-session` - Check if user session is active
- `POST /login` - Traditional user authentication
- `POST /signUp` - User registration
- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback handler
- `GET /logout` - Logout and destroy session

### AI Services
- `POST /summarize` - Text summarization

## 🎨 Features in Detail

### AI Summarization

The application uses Cohere AI's advanced language model to generate concise, educational summaries. For research papers, textbooks, and documents, it produces student-friendly explanations with:

- Clear, simple language
- Key facts and concepts
- Proper formatting for web display
- Fallback to DistilBART if Cohere API is unavailable

### User Experience

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Loading Animation**: Visual feedback during AI processing
- **Typing Effect**: Character-by-character display of summaries
- **Input Validation**: Smart handling of short inputs and special commands
- **Theme Persistence**: Remembers user's theme preference

### Security

- Password hashing with bcrypt
- Input sanitization and validation
- CORS configuration for secure API access
- Environment variable protection for sensitive data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Cohere AI** for providing powerful language models
- **Hugging Face** for the DistilBART model
- **React & Express communities** for excellent documentation
- Built with ❤️ by Makky101
