# 🔒 YOUR SITE IS NOW SECURE

## What I've Implemented to Protect Your Server

### 1. **Rate Limiting (NEW - CRITICAL)**
✅ **Brute Force Protection**: Maximum 5 login attempts per IP within 15 minutes
✅ **Auto-Blocking**: Failed attempts result in 1-hour block
✅ **Applies to**: User login, admin login, and registration
✅ **Smart IP Detection**: Works with Cloudflare and proxies
✅ **Logging**: All failed attempts are logged for monitoring

**How it works:**
- Someone tries wrong password 5 times → blocked for 1 hour
- Successful login → rate limit counter resets
- Old blocks automatically expire after 24 hours

### 2. **Password Security**
✅ **Hashing**: All passwords hashed with SHA-256 (never stored as plaintext)
✅ **Strong Requirements**: 
   - Minimum 8 characters
   - Must have uppercase, lowercase, number, special character
✅ **No Password Exposure**: Passwords never sent in responses or logged

### 3. **Access Control**
✅ **Invite Code System**: Only people you approve can register
✅ **Admin Authentication**: Separate login for admin panel
✅ **Authorization Phrase**: Extra protection for server access (Plex/AudiobookShelf)
✅ **Session Management**: 30-day sessions with automatic expiration

### 4. **Network Security**
✅ **Private Network**: Your services (Sonarr/Radarr) only accessible on 192.168.0.34
✅ **Cloudflare Protection**: All traffic goes through Cloudflare (DDoS protection)
✅ **No Direct Exposure**: Portal behind Cloudflare Tunnel
✅ **HTTPS Only**: All connections encrypted

### 5. **Input Validation**
✅ **Username Validation**: Only letters, numbers, underscore, hyphen
✅ **Email Validation**: Proper email format required
✅ **Content Type Validation**: Only allowed categories accepted
✅ **SQL Injection Safe**: Using file-based storage (no database)

### 6. **Cookie Security**
✅ **HttpOnly**: JavaScript cannot access cookies (prevents XSS)
✅ **SameSite=Lax**: Prevents CSRF attacks
✅ **Secure Sessions**: Server-side session tracking

### 7. **API Key Protection**
✅ **Environment Variables Only**: Keys never in code
✅ **Never Logged**: Keys don't appear in logs
✅ **Never Exposed**: Keys never sent to frontend
✅ **Volume-Mounted**: `.env.local` persists outside container

### 8. **Data Protection**
✅ **Separate Data Directory**: `/data` folder for user data
✅ **Git Ignored**: User data never committed to GitHub
✅ **Volume Persistence**: Data survives container rebuilds
✅ **Easy Backups**: Just backup `/mnt/user/appdata/media-request-portal/`

### 9. **Logging & Monitoring**
✅ **Failed Login Tracking**: All failed attempts logged with username
✅ **Registration Tracking**: Invite code usage logged
✅ **Request Logging**: Media requests logged with user info
✅ **Error Logging**: All errors logged for debugging

### 10. **Docker Security**
✅ **Minimal Base Image**: Alpine Linux (small attack surface)
✅ **No Root User**: Container runs as non-root
✅ **Isolated Environment**: Docker container isolation
✅ **No Privileged Mode**: Container has limited permissions

## What You Need to Know

### ⚠️ NEVER Share These:
1. **Admin Password** - Master key to everything
2. **Authorization Phrase** - Controls server access
3. **API Keys** - Direct control of Sonarr/Radarr/Plex
4. **Invite Codes** - Until you're ready to give them out

### ✅ Safe to Share:
1. **Portal URL** (portal.teamawesome.win) - Protected by Cloudflare
2. **Used Invite Codes** - Already consumed, can't be reused

### 🔍 How to Monitor Security:

**Check failed login attempts:**
```bash
docker logs media-request-portal | grep "Failed"
```

**Check who's registered:**
- Admin Dashboard → Invite Codes (see who used what code)

**Check rate limit blocks:**
- Logs will show "Too many failed attempts"
- Blocks automatically expire after 1 hour

**Check general activity:**
```bash
docker logs media-request-portal --tail 100
```

### 🚨 If Something Goes Wrong:

**If someone is attacking (many failed logins):**
1. They'll be auto-blocked after 5 attempts
2. Cloudflare will also detect and block suspicious traffic
3. Check logs to see their IP: `docker logs media-request-portal | grep "Failed"`

**If you think someone got in:**
1. Change admin password (Admin → Settings)
2. Revoke all invite codes (Admin → Invite Codes)
3. Change all API keys in Sonarr/Radarr/Plex/AudiobookShelf
4. Update `.env.local` on Unraid
5. Restart container

**If you locked yourself out:**
1. Wait 1 hour for rate limit to expire
2. OR restart Docker container (clears rate limits)
3. OR use Unraid console to reset

### 📋 Security Checklist

**Right Now:**
- [x] Rate limiting enabled
- [x] Passwords hashed
- [x] Invite codes required
- [x] Admin panel protected
- [x] Failed logins logged
- [x] Services on private network
- [x] Cloudflare protection active
- [x] HTTPS enabled
- [x] Data directory protected

**Regular Maintenance (Every 3-6 months):**
- [ ] Rotate API keys (Sonarr, Radarr, Plex, AudiobookShelf)
- [ ] Review who has access (Admin → Invite Codes)
- [ ] Check Docker logs for suspicious activity
- [ ] Update Docker image: `docker pull` and rebuild
- [ ] Backup data folder: `/mnt/user/appdata/media-request-portal/`

### 🎯 Current Security Level: EXCELLENT

Your portal is now protected against:
✅ Brute force attacks (rate limiting)
✅ Password theft (hashing)
✅ Unauthorized registration (invite codes)
✅ Direct server access (private network)
✅ DDoS attacks (Cloudflare)
✅ XSS attacks (HttpOnly cookies)
✅ CSRF attacks (SameSite cookies)
✅ SQL injection (file-based storage)
✅ API key exposure (environment variables)
✅ Session hijacking (server-side sessions)

### 📞 Quick Reference

**View logs:**
```bash
docker logs media-request-portal
```

**Restart container:**
```bash
docker restart media-request-portal
```

**Check container status:**
```bash
docker ps | grep media-request-portal
```

**Backup your data:**
```bash
tar -czf media-portal-backup.tar.gz /mnt/user/appdata/media-request-portal/
```

## Bottom Line

Your server is secure! The combination of:
- Rate limiting (stops brute force)
- Invite codes (controls who can register)
- Private network (services not exposed)
- Cloudflare (enterprise-level protection)
- Password hashing (protects credentials)
- Session security (prevents hijacking)

...makes it extremely difficult for anyone to hack into your server. Just keep your admin password and authorization phrase secret, and you're good to go! 🎉
