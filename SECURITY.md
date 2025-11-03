# Security Best Practices for Media Request Portal

## Current Security Measures

### 1. Authentication & Authorization
✅ **Cookie-based sessions** with HttpOnly flag (prevents XSS attacks)
✅ **Invite code system** - only authorized users can register
✅ **Password requirements** - minimum 8 chars, uppercase, lowercase, number, special character
✅ **Admin panel protection** - separate authentication for admin access
✅ **Authorization phrase** - additional protection for server access requests (Plex/AudiobookShelf)

### 2. API Security
✅ **Method validation** - APIs only accept specified HTTP methods
✅ **Input validation** - all user inputs are validated and sanitized
✅ **Session checks** - user and admin sessions validated on protected endpoints
✅ **Error handling** - errors don't expose internal system details

### 3. Data Protection
✅ **Password hashing** - passwords stored as SHA-256 hashes, never plaintext
✅ **Separate data storage** - user data isolated in `/data` directory
✅ **File-based sessions** - sessions tracked server-side, not in client cookies

## Recommended Additional Security Measures

### 1. **Cloudflare Protection (CRITICAL - Already Set Up)**
Your portal.teamawesome.win domain should be protected by:
- ✅ Cloudflare Access for admin pages
- ✅ Cloudflare Tunnel (no exposed ports)
- ✅ DDoS protection
- ✅ Bot protection
- ⚠️ Consider adding Rate Limiting rules

### 2. **Network Isolation (Recommended)**
Keep your services on private network (192.168.0.34):
- ✅ Portal connects to services via internal IPs
- ✅ Services not directly exposed to internet
- ✅ All external access goes through Cloudflare Tunnel

### 3. **API Key Protection**
Your API keys are secure because:
- ✅ Stored in `.env.local` (never committed to Git)
- ✅ Only accessible inside Docker container
- ✅ Not exposed in API responses
- ⚠️ Rotate keys periodically (every 3-6 months)

### 4. **Docker Security**
Current setup:
- ✅ Non-root user inside container
- ✅ Isolated container environment
- ✅ Minimal Alpine Linux base image
- ✅ No unnecessary packages installed

### 5. **Rate Limiting (IMPORTANT - TO IMPLEMENT)**
Protect against brute force attacks:
- Limit login attempts per IP
- Limit API requests per user
- Block repeated failed authorization attempts

### 6. **Input Sanitization**
Already implemented:
- ✅ Username/password validation with regex patterns
- ✅ Content type validation (only allowed types)
- ✅ Title sanitization for Sonarr/Radarr searches
- ✅ No SQL injection risk (file-based storage)

### 7. **HTTPS/SSL**
- ✅ Handled by Cloudflare (portal.teamawesome.win uses HTTPS)
- ✅ Backend communication is on private network (192.168.0.34)

### 8. **Session Security**
Current implementation:
- ✅ HttpOnly cookies (prevents JavaScript access)
- ✅ SameSite=Lax (prevents CSRF)
- ✅ 30-day session expiration
- ⚠️ Consider implementing session rotation

### 9. **Logging & Monitoring**
Current logging:
- ✅ User registration events logged
- ✅ Login attempts logged
- ✅ Content requests logged
- ✅ API errors logged
- ⚠️ Consider adding failed login tracking
- ⚠️ Consider adding suspicious activity alerts

## What Could Go Wrong & Mitigations

### Threat: Brute Force Login Attacks
**Risk**: Attacker tries many passwords
**Mitigation**: 
- Implement rate limiting (see next update)
- Use Cloudflare's bot protection
- Monitor failed login attempts

### Threat: API Key Exposure
**Risk**: API keys stolen and used to control services
**Mitigation**:
- ✅ Keys never exposed in frontend
- ✅ Keys never logged
- ✅ Keys stored in environment variables only
- Rotate keys periodically

### Threat: Unauthorized Access to Services
**Risk**: Someone bypasses portal to access Sonarr/Radarr
**Mitigation**:
- ✅ Services on private network (192.168.0.34)
- ✅ Cloudflare Access protects service URLs
- ✅ Services require API keys
- Keep services on private network only

### Threat: XSS (Cross-Site Scripting)
**Risk**: Malicious JavaScript injected into pages
**Mitigation**:
- ✅ Next.js automatically escapes user inputs
- ✅ HttpOnly cookies prevent script access
- ✅ No `dangerouslySetInnerHTML` used

### Threat: CSRF (Cross-Site Request Forgery)
**Risk**: Attacker tricks user into making unwanted requests
**Mitigation**:
- ✅ SameSite=Lax cookie setting
- ✅ CORS restrictions
- ✅ Credentials required for all authenticated requests

### Threat: Session Hijacking
**Risk**: Attacker steals session cookie
**Mitigation**:
- ✅ HttpOnly cookies (not accessible to JavaScript)
- ✅ HTTPS only (via Cloudflare)
- ✅ SameSite protection
- Sessions expire after 30 days

### Threat: Container Escape
**Risk**: Attacker breaks out of Docker container
**Mitigation**:
- ✅ Alpine Linux (minimal attack surface)
- ✅ No privileged mode
- ✅ Limited volume mounts
- Keep Docker updated

## Security Checklist

### Immediate Actions (Done)
- [x] Use HTTPS (via Cloudflare)
- [x] Hash passwords (SHA-256)
- [x] Validate all inputs
- [x] Use HttpOnly cookies
- [x] Protect admin panel
- [x] Invite code system
- [x] Keep services on private network
- [x] Store API keys in environment variables

### Recommended Actions (Next Steps)
- [ ] Implement rate limiting on login/registration
- [ ] Add failed login attempt tracking
- [ ] Set up email alerts for suspicious activity
- [ ] Implement session rotation after password change
- [ ] Add CAPTCHA to registration (optional)
- [ ] Regular security audits
- [ ] Keep all software updated

### Best Practices for You
1. **Never share your admin password** - it's the master key
2. **Only give invite codes to trusted people** - they can access your services
3. **Rotate API keys every 3-6 months** - reduces risk if compromised
4. **Monitor Docker logs** regularly for suspicious activity
5. **Keep authorization phrase secret** - only for server access requests
6. **Backup your data folder** - `/mnt/user/appdata/media-request-portal/data`
7. **Update the Docker image** regularly to get security patches

## How to Check Security

### Check Docker logs for suspicious activity:
```bash
docker logs media-request-portal | grep -i "failed\|error\|unauthorized"
```

### Check who has registered:
- Admin Dashboard → Invite Codes (see who used codes)

### Check failed login attempts:
- Look for "Invalid username or password" in logs

### Monitor Cloudflare:
- Check Cloudflare dashboard for attack attempts
- Review security events and blocked requests

## Emergency Response

### If you suspect compromise:
1. **Immediately revoke all invite codes** (Admin → Invite Codes)
2. **Change admin password** (Admin → Settings)
3. **Rotate all API keys** (Plex, Sonarr, Radarr, AudiobookShelf)
4. **Check Docker logs** for unauthorized access
5. **Restart container** with new credentials
6. **Review Cloudflare logs** for attack patterns

### If API keys are compromised:
1. Change API keys in respective services
2. Update `.env.local` on Unraid
3. Restart Docker container
4. Review recent API activity in each service

## Current Security Status: ✅ GOOD

Your setup is already quite secure:
- Services on private network
- Cloudflare protection
- Authentication required
- Password hashing
- Invite code system
- No direct exposure to internet

The next update will add rate limiting for even better protection!
