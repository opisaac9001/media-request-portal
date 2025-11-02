# Deployment Guide for Unraid

## Option 1: Docker Compose (Recommended)

### Steps:

1. **Transfer files to Unraid:**
   - Copy the entire `media-request-portal` folder to your Unraid server (e.g., `/mnt/user/appdata/media-request-portal/`)
   - You can use SMB share, SCP, or any file transfer method

2. **Configure environment variables:**
   - Copy `.env.local` to the same folder or edit `docker-compose.yml` with your values
   - Or create a `.env` file in the project root with all your settings

3. **Build and run:**
   ```bash
   cd /mnt/user/appdata/media-request-portal
   docker-compose up -d
   ```

4. **Access your portal:**
   - Visit `http://YOUR-UNRAID-IP:48532`

### To update:
```bash
cd /mnt/user/appdata/media-request-portal
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Option 2: Unraid Community Applications (Docker Template)

### Steps:

1. **Build the image on your Windows machine:**
   ```powershell
   docker build -t media-request-portal .
   docker save media-request-portal > media-request-portal.tar
   ```

2. **Transfer to Unraid and load:**
   ```bash
   docker load < media-request-portal.tar
   ```

3. **Add custom Docker container in Unraid:**
   - Go to Docker tab → Add Container
   - Name: `media-request-portal`
   - Repository: `media-request-portal:latest`
   - Network Type: Bridge
   - Port Mapping: `48532:3000`
   - Add all environment variables from `.env.local`

---

## Option 3: Manual Node.js Installation

If you prefer not to use Docker:

1. **Install Node.js on Unraid:**
   ```bash
   # Install Nerd Tools plugin first from Community Applications
   # Then install Node.js from Nerd Tools
   ```

2. **Transfer files:**
   - Copy project to `/mnt/user/appdata/media-request-portal/`

3. **Build and run:**
   ```bash
   cd /mnt/user/appdata/media-request-portal
   npm install
   npm run build
   npm start
   ```

4. **Set up autostart:**
   - Create a user script in Unraid to start the app on boot

---

## Environment Variables

Make sure all these are set (from your `.env.local`):

- AUTHORIZATION_PHRASE
- ADMIN_USERNAME
- ADMIN_PASSWORD
- PLEX_BASE_URL
- PLEX_TOKEN
- PLEX_LIBRARY_IDS
- RADARR_BASE_URL
- RADARR_API_KEY
- RADARR_ROOT_FOLDER
- RADARR_KIDS_ROOT_FOLDER
- SONARR_BASE_URL
- SONARR_API_KEY
- SONARR_QUALITY_PROFILE
- SONARR_LANGUAGE_PROFILE
- SONARR_ROOT_FOLDER
- SONARR_ANIME_ROOT_FOLDER
- SONARR_ADULT_SWIM_ROOT_FOLDER
- SONARR_CARTOONS_ROOT_FOLDER

---

## Networking Tips

- If Plex/Sonarr/Radarr are on the same Unraid server, use Docker network names (e.g., `http://sonarr:8989` instead of IP addresses)
- If using reverse proxy (like Nginx Proxy Manager), set that up to access via domain name
- Open port 48532 in Unraid firewall if accessing from outside your network

---

## Troubleshooting

**Build fails:**
```bash
docker-compose build --no-cache
```

**Container won't start:**
```bash
docker-compose logs
```

**Can't connect to Sonarr/Radarr:**
- Check if using correct URLs (container names vs IPs)
- Verify API keys are correct
- Ensure containers are on the same Docker network
