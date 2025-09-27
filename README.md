# 🚀 WebWizard - Real-Time Chat Application

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6.20.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

**A modern, feature-rich real-time chat application with advanced UI/UX**

[📖 Full Documentation](./DOCUMENTATION.md) • [🚀 Features](#features) • [⚡ Quick Start](#quick-start)

</div>

---

## ✨ Features

### 🎯 Core Features
- ⚡ **Real-time messaging** with Socket.IO
- 🔐 **OAuth authentication** (GitHub & Google)
- 🏠 **Public & Private rooms** with password protection
- 👥 **User presence & typing indicators**
- 📱 **Responsive design** for all devices
- 🔔 **Toast notifications** for user interactions

### 🎨 Advanced UI/UX
- 🌙 **Dark theme optimized** interface
- ✨ **Smooth animations** with Framer Motion
- 📋 **Participants panel** with user management
- 🎨 **Custom scrollbars** and modern styling
- 📊 **Real-time participant counts**
- 🎭 **Avatar system** with user initials

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB instance
- OAuth app credentials (GitHub/Google)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd webwizard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the application**
   ```bash
   # Terminal 1: Start Socket.IO server
   npm run backend
   
   # Terminal 2: Start Next.js app
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Socket.IO Server: http://localhost:3001

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library with latest features
- **Tailwind CSS 4** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Socket.IO Client** - Real-time communication

### Backend
- **Express.js** - Web framework
- **Socket.IO** - WebSocket server
- **MongoDB** - Database with Mongoose ODM
- **NextAuth.js** - Authentication
- **JWT** - Token management

### UI Components
- **Radix UI** - Headless components
- **Lucide React** - Icon library
- **React Hot Toast** - Notifications

## 🏗 Project Structure

```
webwizard/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── dashboard/         # Chat dashboard
│   └── login/             # Authentication
├── backend/               # Socket.IO server
├── components/            # React components
│   ├── chat/             # Chat-specific components
│   └── ui/               # Reusable UI components
├── db/                   # Database configuration
├── models/               # Mongoose schemas
└── public/               # Static assets
```

## 🚀 Scripts

```bash
npm run dev      # Start development server
npm run backend  # Start Socket.IO server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 📡 Key Features Implementation

### Real-Time Messaging
- Instant message delivery with Socket.IO
- Message persistence with MongoDB
- Typing indicators and user presence
- System notifications for join/leave events

### Authentication System
- OAuth integration with GitHub and Google
- JWT-based session management
- Protected routes and API endpoints
- User profile management

### Chat Room Management
- Create public and private rooms
- Password protection for private rooms
- Real-time participant management
- Room discovery and joining

### Toast Notification System
- Join/leave notifications (green/gray)
- New message alerts (blue)
- Real-time user interaction feedback
- Custom styled notifications

## 🔧 Environment Variables

Create a `.env.local` file with:

```env
MONGODB_URI=mongodb://localhost:27017/webwizard
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_BACKEND_WS=http://localhost:3001
JWT_SECRET=your-jwt-secret
```

## 📚 Documentation

For detailed documentation, API references, and advanced configuration, see:

**[📖 Full Documentation](./DOCUMENTATION.md)**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ using modern web technologies**

Made with [Next.js](https://nextjs.org) • Powered by [Socket.IO](https://socket.io) • Styled with [Tailwind CSS](https://tailwindcss.com)

</div>
