# Unraid Docker Setup Guide

## Initial Setup

1. **Copy `.env.local` to a persistent location on your Unraid server:**
   ```bash
   mkdir -p /mnt/user/appdata/media-request-portal
   cp .env.local /mnt/user/appdata/media-request-portal/.env.local
   ```

2. **Build the Docker image on your Unraid server:**
   ```bash
   cd /path/to/media-request-portal
   docker build -t media-request-portal .
   ```

## Unraid Docker Template Settings

Add a new container in Unraid with these settings:

**Container Settings:**
- **Name:** `media-request-portal`
- **Repository:** `media-request-portal` (the image you just built)
- **Network Type:** `Bridge`
- **Port Mappings:**
  - Container Port: `3000`
  - Host Port: `48532`
  - Protocol: `TCP`

**Volume Mappings:**
- **Container Path:** `/app/.env.local`
- **Host Path:** `/mnt/user/appdata/media-request-portal/.env.local`
- **Access Mode:** `Read/Write`

- **Container Path:** `/app/data`
- **Host Path:** `/mnt/user/appdata/media-request-portal/data`
- **Access Mode:** `Read/Write`

**Environment Variables:**
Load from file at: `/mnt/user/appdata/media-request-portal/.env.local`

Or manually add each variable:
- `AUTHORIZATION_PHRASE`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `PLEX_BASE_URL`
- `PLEX_TOKEN`
- `PLEX_LIBRARY_IDS`
- `RADARR_BASE_URL`
- `RADARR_API_KEY`
- `RADARR_ROOT_FOLDER`
- `RADARR_KIDS_ROOT_FOLDER`
- `SONARR_BASE_URL`
- `SONARR_API_KEY`
- `SONARR_QUALITY_PROFILE`
- `SONARR_LANGUAGE_PROFILE`
- `SONARR_ROOT_FOLDER`
- `SONARR_ANIME_ROOT_FOLDER`
- `SONARR_ADULT_SWIM_ROOT_FOLDER`
- `SONARR_CARTOONS_ROOT_FOLDER`

## Updating the Container

When you need to update after code changes:

1. **Stop the container** (via Unraid web UI)

2. **Rebuild the image:**
   ```bash
   cd /path/to/media-request-portal
   docker build -t media-request-portal .
   ```

3. **Start the container** (via Unraid web UI)

Your settings in `/mnt/user/appdata/media-request-portal/.env.local` will persist!

## Quick Command Reference

**Stop container:**
```bash
docker stop media-request-portal
```

**Remove container:**
```bash
docker rm media-request-portal
```

**Rebuild and run:**
```bash
docker build -t media-request-portal . && \
docker run -d \
  --name media-request-portal \
  -p 48532:3000 \
  -v /mnt/user/appdata/media-request-portal/.env.local:/app/.env.local:rw \
  -v /mnt/user/appdata/media-request-portal/data:/app/data:rw \
  --restart unless-stopped \
  media-request-portal
```

## Benefits of This Setup

✅ Your `.env.local` configuration persists across container rebuilds
✅ User accounts and sessions persist across container rebuilds
✅ No need to re-enter API keys and passwords
✅ Easy to backup (just backup `/mnt/user/appdata/media-request-portal/`)
✅ Standard Unraid appdata location
