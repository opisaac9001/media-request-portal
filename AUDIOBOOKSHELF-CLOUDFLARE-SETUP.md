# AudiobookShelf Cloudflare Tunnel Setup

This guide explains how to expose your AudiobookShelf instance through Cloudflare Tunnel so users can access it via a public domain instead of requiring their own Tailscale setup.

## Architecture

```
User with Plappa App
    ↓
https://audiobooks.yourdomain.duckdns.org (Your Domain)
    ↓
Cloudflare Tunnel
    ↓
Portal Container (has cloudflared + tailscaled)
    ↓ (via Tailscale network)
AudiobookShelf Host (100.87.53.48:13378 - books.tail4b4f12.ts.net)
```

The cloudflared service runs **inside your portal Docker container** and proxies requests via Tailscale to your AudiobookShelf host.

## Prerequisites

- Cloudflare account (free tier works)
- Domain name (can use your existing DuckDNS domain or subdomain)
- AudiobookShelf running on Tailscale network (100.87.53.48:13378)
- Portal container already has Tailscale configured

## Step 1: Create Cloudflare Tunnel (Web Dashboard Method)

This is easier than using CLI - we'll create the tunnel through Cloudflare's web dashboard.

1. **Go to Cloudflare Zero Trust Dashboard:**
   - Visit: https://one.dash.cloudflare.com/
   - Sign in with your Cloudflare account
   - If first time: You'll be prompted to choose a team name (can be anything)

2. **Create a New Tunnel:**
   - Navigate to: **Networks** → **Tunnels**
   - Click **Create a tunnel**
   - Choose **Cloudflared** as the connector type
   - Click **Next**

3. **Name Your Tunnel:**
   - Name: `audiobookshelf` (or any name you prefer)
   - Click **Save tunnel**

4. **Skip the Connector Installation:**
   - You'll see installation instructions - **ignore these**
   - We'll use the token in Docker instead
   - Look for the command that shows: `cloudflared tunnel run --token eyJh...`
   - **Copy the entire token** (starts with `eyJh` and is very long)
   - Click **Next**

## Step 2: Configure Tunnel Route

Still in the Cloudflare dashboard:

1. **Add Public Hostname:**
   - **Subdomain**: `audiobooks` (or whatever you want)
   - **Domain**: Select your domain from dropdown
   - Full hostname will be: `audiobooks.yourdomain.com`

2. **Configure Service:**
   - **Type**: `HTTP`
   - **URL**: `100.87.53.48:13378`
   - This is your AudiobookShelf Tailscale IP and port
   
3. **Additional settings (optional):**
   - Leave other settings as default
   - Click **Save tunnel**

The DNS record is automatically created for you!

## Step 3: Update Portal Environment Variables

Edit `.env.local` and add:

```env
# Paste the token you copied from Step 1
CLOUDFLARE_TUNNEL_TOKEN=eyJhxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Update with your actual domain
AUDIOBOOKSHELF_PUBLIC_URL=https://audiobooks.yourdomain.com
```

## Step 4: Rebuild and Start Portal

```powershell
docker compose down
docker compose up -d --build
```

The container will now:
1. Start Tailscale (connecting to your tailnet)
2. Start Cloudflare Tunnel (connecting to Cloudflare)
3. Start the Next.js application
4. Cloudflared proxies requests from your domain → via Tailscale → to AudiobookShelf

## Step 5: Test Access

1. Visit `https://audiobooks.yourdomain.duckdns.org` in browser
2. Should see AudiobookShelf login page
3. Test with Plappa app:
   - Server URL: `https://audiobooks.yourdomain.duckdns.org`
   - Username: (from portal)
   - Password: (from portal)

## Usage Guidelines for Users

**To minimize Cloudflare bandwidth:**
- ✅ **Download books for offline listening** (recommended)
- ✅ Download once, listen many times offline
- ⚠️ Avoid streaming the same book repeatedly
- ⚠️ Use download feature in Plappa instead of streaming

## Troubleshooting

### Check container logs:
```powershell
docker logs media-request-portal
```

Look for:
- `Authenticating with Tailscale...` - Tailscale connecting
- `Starting Cloudflare Tunnel...` - Cloudflared starting
- You should see tunnel connection messages

### Tunnel not connecting:
- Verify token is correct in `.env.local`
- Check Cloudflare dashboard: Networks → Tunnels → Your tunnel should show "HEALTHY"
- Restart container: `docker compose restart`

### DNS not resolving:
- Wait 5-10 minutes for DNS propagation
- Check Cloudflare DNS dashboard for CNAME record (should be auto-created)
- Ensure proxy status is "Proxied" (orange cloud)

### 502 Bad Gateway:
- Verify AudiobookShelf is accessible via Tailscale from portal:
  ```powershell
  docker exec media-request-portal wget -O- http://100.87.53.48:13378
  ```
- Check that AudiobookShelf is running on the host machine
- Verify Tailscale IP is correct (100.87.53.48)

### Can't create accounts:
- Check `AUDIOBOOKSHELF_BASE_URL` is set to `http://100.87.53.48:13378`
- Verify `AUDIOBOOKSHELF_API_TOKEN` is correct
- Test API from container:
  ```powershell
  docker exec media-request-portal wget -O- http://100.87.53.48:13378/api/libraries
  ```

### Cloudflare blocking traffic:
- Check Cloudflare email for ToS warnings
- Reduce streaming, encourage downloads
- Consider Cloudflare paid plan or alternative solution

## How It Works

1. **User Request**: User opens Plappa, enters `https://audiobooks.yourdomain.com`
2. **Cloudflare Receives**: Request hits Cloudflare's edge network
3. **Tunnel Routes**: Cloudflare tunnel routes to your portal container
4. **Tailscale Proxies**: Portal container forwards via Tailscale to AudiobookShelf (100.87.53.48:13378)
5. **Response Returns**: AudiobookShelf responds, goes back through same path

Everything is encrypted and secure:
- HTTPS (Cloudflare to user)
- Cloudflare Tunnel (encrypted connection to your container)
- Tailscale (encrypted connection to AudiobookShelf)

## Backup Access Method

Keep Tailscale access available as backup:
- Power users can use Tailscale for unlimited bandwidth
- Cloudflare for casual users
- If Cloudflare has issues, fall back to Tailscale sharing

## Monitoring

Watch your Cloudflare Analytics:
- Dashboard → Analytics → Traffic
- Monitor bandwidth usage
- If approaching 1TB/month, consider alternatives

## Notes

- Free Cloudflare tier prohibits excessive media streaming
- Downloading is safer than streaming for ToS compliance
- ~10-15 users with download-first approach should be safe
- Monitor usage and adjust if needed
