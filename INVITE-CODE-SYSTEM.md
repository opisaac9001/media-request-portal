# Unified Invite Code System

## Overview
The invite code system has been updated to provide a unified, flexible approach to user onboarding. Each invite code can now be used for either Plex access or standard registration, making it easier to manage and share codes with friends.

## How It Works

### Single-Use Codes
- Each invite code can only be used **once**
- The code works for **both** the Plex access page and the registration page
- Once used on either page, the code becomes invalid
- Tracks which flow the code was used in for admin visibility

### Two Registration Flows

#### 1. Plex Access Flow (`/access`)
**Creates account + Sends Plex invitation**

Users provide:
- Invite code
- Username
- Email address
- Password (with confirmation)

Result:
- User account is created
- Plex invitation is sent to their email
- Invite code is marked as used for "Plex"
- Users can immediately log in and request media content

#### 2. Standard Registration Flow (`/register`)
**Creates account only**

Users provide:
- Invite code
- Username
- Email address
- Password (with confirmation)

Result:
- User account is created
- No Plex invitation is sent
- Invite code is marked as used for "Registration"
- Users can log in and request media content (but won't have Plex access unless invited separately)

## Password Requirements
All user accounts require strong passwords with:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## Admin Management

### Generating Codes
1. Navigate to **Admin Dashboard** → **Invite Codes**
2. Click "➕ Generate New Invite Code"
3. Copy the code and share it with the user
4. The code can be used on either `/access` or `/register`

### Viewing Code Usage
The admin panel displays:
- **Invite Code**: The actual code (format: XXXX-XXXX-XXXX)
- **Status**: Active, Used, or Revoked
- **Created**: When the code was generated
- **Used By**: Username of the person who used it
- **Used For**: Badge showing "🎬 Plex" or "📝 Registration"
- **Used At**: Timestamp of when it was used

### Revoking Codes
- Active codes can be revoked before use
- Used codes cannot be revoked (but are already invalid)
- Revoked codes cannot be re-activated

## Benefits

### For Administrators
- Generate one type of code for all use cases
- Easier code management
- Clear tracking of which flow was used
- Single-use enforcement prevents code sharing

### For Users
- Flexibility to choose their access level
- Same code works for both flows
- Simple, consistent registration experience
- Secure account creation with strong passwords

## Security Features
- Rate limiting on registration attempts
- Failed login tracking
- Password hashing (SHA-256)
- HttpOnly session cookies
- Single-use invite codes
- Username and email uniqueness validation

## Example Scenarios

### Scenario 1: Plex Server User
1. Admin generates invite code: `ABCD-1234-WXYZ`
2. User visits `/access` page
3. User enters code, creates username/password
4. Account is created + Plex invite sent
5. Code marked as used for "Plex"
6. User can log in, request media, and access Plex

### Scenario 2: Content Requester Only
1. Admin generates invite code: `EFGH-5678-STUV`
2. User visits `/register` page
3. User enters code, creates username/password
4. Account is created (no Plex invite)
5. Code marked as used for "Registration"
6. User can log in and request media content

### Scenario 3: Code Already Used
1. User tries to use code `ABCD-1234-WXYZ` again
2. System checks: code is already marked as used
3. Registration/access fails with error message
4. User needs to request a new code from admin

## Migration Notes
- Existing invite codes are compatible with the new system
- The `usedFor` field will be added when codes are used
- Old codes marked as "used" without `usedFor` will show "-" in admin panel
- All new registrations will properly track the flow type
