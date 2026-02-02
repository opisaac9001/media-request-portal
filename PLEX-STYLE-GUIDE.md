# Plex-Inspired UI Style Guide

## Design System

### Color Palette
- **Primary Background**: `linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%)`
- **Card Background**: `rgba(15, 25, 45, 0.85)` with `backdrop-filter: blur(20px)`
- **Input Background**: `rgba(30, 50, 80, 0.5)`
- **Primary Blue**: `#5ea1f0`
- **Success Green**: `#10b981`
- **Error Red**: `#ef4444`
- **Text Primary**: `#ffffff`
- **Text Secondary**: `rgba(255, 255, 255, 0.7)`
- **Text Muted**: `rgba(255, 255, 255, 0.5)`

### Action Card Colors
- **Cyan/Blue** (Plex Access): `linear-gradient(135deg, rgba(56, 189, 248, 0.9) 0%, rgba(14, 165, 233, 0.9) 100%)`
- **Orange** (Media Content): `linear-gradient(135deg, rgba(251, 191, 36, 0.9) 0%, rgba(245, 158, 11, 0.9) 100%)`
- **Purple** (Audiobooks): `linear-gradient(135deg, rgba(192, 132, 252, 0.9) 0%, rgba(168, 85, 247, 0.9) 100%)`
- **Red/Coral** (Game Servers): `linear-gradient(135deg, rgba(248, 113, 113, 0.9) 0%, rgba(239, 68, 68, 0.9) 100%)`

### Typography
- **Heading Font**: System fonts, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto"
- **Main Heading**: 32px-56px, font-weight: 700
- **Sub Heading**: 24px-40px, font-weight: 400-600
- **Body Text**: 14-16px
- **Small Text**: 12-14px

### Component Styles

#### Logo Component
```tsx
<Link href="/">
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#fff'
    }}>
      P
    </div>
    <span style={{
      fontSize: '24px',
      fontWeight: '300',
      letterSpacing: '2px',
      color: '#5ea1f0',
      textTransform: 'uppercase'
    }}>
      PLEXUS
    </span>
  </div>
</Link>
```

#### Form Input
```tsx
<input 
  style={{
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: '2px solid rgba(94, 161, 240, 0.3)',
    borderRadius: '10px',
    background: 'rgba(30, 50, 80, 0.5)',
    color: '#fff',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box'
  }}
  onFocus={(e) => {
    e.currentTarget.style.borderColor = '#5ea1f0';
    e.currentTarget.style.background = 'rgba(30, 50, 80, 0.7)';
  }}
  onBlur={(e) => {
    e.currentTarget.style.borderColor = 'rgba(94, 161, 240, 0.3)';
    e.currentTarget.style.background = 'rgba(30, 50, 80, 0.5)';
  }}
/>
```

#### Primary Button
```tsx
<button 
  style={{
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #5ea1f0 0%, #3b82f6 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(94, 161, 240, 0.3)'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 6px 20px rgba(94, 161, 240, 0.5)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 4px 15px rgba(94, 161, 240, 0.3)';
  }}
/>
```

#### Message/Alert Box
```tsx
<div style={{
  padding: '16px',
  borderRadius: '12px',
  marginBottom: '24px',
  background: messageType === 'success' 
    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)'
    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
  border: `1px solid ${messageType === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
  color: messageType === 'success' ? '#10b981' : '#ef4444',
  fontSize: '14px',
  fontWeight: '500'
}}>
  {message}
</div>
```

#### Action Card (Home Page)
```tsx
<Link href="/path" style={{
  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.9) 0%, rgba(14, 165, 233, 0.9) 100%)',
  borderRadius: '20px',
  padding: '40px 20px',
  textDecoration: 'none',
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
  transition: 'all 0.3s ease',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
  cursor: 'pointer'
}}
onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'translateY(-8px)';
  e.currentTarget.style.boxShadow = '0 16px 32px rgba(56, 189, 248, 0.4)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'translateY(0)';
  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)';
}}>
  <div style={{
    width: '70px',
    height: '70px',
    background: 'rgba(255, 255, 255, 0.25)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px'
  }}>
    🔓
  </div>
  <div style={{
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '1.4',
    textAlign: 'center'
  }}>
    Action Title
  </div>
</Link>
```

### Layout Structure

#### Full-Screen Page (Login/Register)
```tsx
<div style={{
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  position: 'relative',
  overflow: 'hidden'
}}>
  {/* Background effects */}
  <div style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 20% 50%, rgba(94, 161, 240, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(94, 161, 240, 0.15) 0%, transparent 50%)',
    pointerEvents: 'none'
  }} />
  
  {/* Logo in top left */}
  <Link href="/" style={{
    position: 'absolute',
    top: '30px',
    left: '30px'
  }}>
    {/* Logo component here */}
  </Link>

  {/* Content container */}
  <div style={{
    position: 'relative',
    zIndex: 1,
    maxWidth: '450px',
    width: '100%',
    background: 'rgba(15, 25, 45, 0.85)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '50px 40px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(94, 161, 240, 0.2)',
    border: '1px solid rgba(94, 161, 240, 0.2)'
  }}>
    {/* Page content */}
  </div>
</div>
```

### Animations

#### Pulse (for decorative elements)
```css
@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}
```

#### Hover Elevation
```tsx
// Add to interactive elements
onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'translateY(-2px)';
  e.currentTarget.style.boxShadow = '0 6px 20px rgba(94, 161, 240, 0.5)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'translateY(0)';
  e.currentTarget.style.boxShadow = '0 4px 15px rgba(94, 161, 240, 0.3)';
}}
```

### Responsive Design
- Use `clamp()` for responsive font sizes
- Use CSS Grid with `auto-fit` for card layouts
- Maintain 20px padding on mobile
- Stack elements vertically on smaller screens

### Accessibility
- Maintain contrast ratios for text (WCAG AA)
- Include proper focus states on interactive elements
- Use semantic HTML where possible
- Add proper ARIA labels for screen readers

## Implementation Notes

1. **Consistency**: All pages should use the same blue gradient background
2. **Logo Placement**: Always include the PLEXUS logo in the top left on form pages
3. **Form Styling**: Use consistent input styling across all forms
4. **Buttons**: Primary actions use the blue gradient, secondary actions can use other colors
5. **Spacing**: Maintain consistent padding and margins (20px, 30px, 40px increments)
6. **Borders**: Use `rgba(94, 161, 240, 0.2)` for subtle borders
7. **Shadows**: Use multiple box-shadows for depth (dark shadow + colored glow)
8. **Transitions**: All interactive elements should have 0.3s ease transitions

## Pages Updated
- ✅ Home (`index.tsx`)
- ✅ Login (`login.tsx`)
- ✅ Register (`register.tsx`)
- ⏳ Access Request (`access.tsx`)
- ⏳ Media Requests (`requests.tsx`)
- ⏳ Audiobooks (`audiobooks.tsx`)
- ⏳ Book Requests (`book-request.tsx`)
- ⏳ Admin Pages (dashboard, etc.)
