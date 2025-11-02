# Media Request Portal

A beautiful, modern web portal for managing Plex media requests and server access. Built with Next.js, TypeScript, and integrated with Sonarr/Radarr for automated content management.

## ✨ Features

- 🎬 **Media Request System**: Request movies, TV shows, anime, and more
- 🔐 **Plex Access Portal**: Automated access management for your Plex server
- 🎨 **Stunning UI**: Modern design with purple gradients and glassmorphism
- 🤖 **Automation Ready**: Integrates with Sonarr and Radarr APIs
- 📱 **Responsive Design**: Works perfectly on desktop and mobile
- 🔒 **Admin Panel**: Secure configuration management

### Content Categories
- Movies (Standard & Children's)
- TV Shows
- Anime (with absolute numbering support)
- Adult Swim
- Saturday Morning Cartoons

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Plex Media Server
- Sonarr (for TV shows)
- Radarr (for movies)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd media-request-portal
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your actual configuration values.

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   Navigate to `http://localhost:3000`

## 🔧 Configuration

All configuration is done through environment variables in `.env.local`:

### Required Settings
- `AUTHORIZATION_PHRASE`: Secret phrase for users to submit requests
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: Admin panel credentials
- `PLEX_BASE_URL` / `PLEX_TOKEN`: Plex server connection
- `SONARR_BASE_URL` / `SONARR_API_KEY`: Sonarr instance
- `RADARR_BASE_URL` / `RADARR_API_KEY`: Radarr instance

See `.env.example` for complete configuration options.

## 🐳 Deployment (Unraid/Docker)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions including:
- Docker Compose setup
- Unraid installation
- Environment configuration
- Network setup

**Quick Deploy with Docker Compose**:
```bash
docker-compose up -d
```

Access at `http://YOUR-SERVER-IP:48532`

## 📁 Project Structure

```
media-request-portal/
├── components/          # React components
├── pages/              # Next.js pages and API routes
│   ├── api/           # Backend API endpoints
│   └── admin/         # Admin panel pages
├── styles/            # Global CSS
├── public/            # Static assets
├── Dockerfile         # Docker build configuration
├── docker-compose.yml # Docker deployment config
└── .env.example       # Environment template
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with Turbopack
- **Language**: TypeScript
- **Styling**: Custom CSS with modern gradients
- **APIs**: Plex, Sonarr v3, Radarr v3
- **Deployment**: Docker

## 🔐 Security Notes

- Never commit `.env.local` with real credentials
- Change default admin credentials immediately
- Use strong authorization phrases
- Consider using HTTPS in production
- Keep API keys secure

## 📝 License

MIT License - feel free to use and modify for your own setup!