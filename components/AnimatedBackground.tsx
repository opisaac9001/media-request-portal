import { useEffect, useRef } from 'react';

interface AnimatedBackgroundProps {
  style?: React.CSSProperties;
}

export default function AnimatedBackground({ style }: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Particle network configuration
    const particleCount = 60;
    const connectionDistance = 250;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
    }> = [];

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1
      });
    }

    // Isometric shapes
    const shapes: Array<{
      x: number;
      y: number;
      rotation: number;
      rotationSpeed: number;
      size: number;
      opacity: number;
    }> = [];

    for (let i = 0; i < 15; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.005,
        size: Math.random() * 80 + 40,
        opacity: Math.random() * 0.1 + 0.05
      });
    }

    // Animation loop
    let animationFrameId: number;
    
    const drawIsometricCube = (x: number, y: number, size: number, rotation: number, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      
      // Draw isometric cube faces
      ctx.strokeStyle = `rgba(94, 161, 240, ${opacity})`;
      ctx.lineWidth = 1.5;
      
      // Top face
      ctx.beginPath();
      ctx.moveTo(0, -size / 2);
      ctx.lineTo(size / 2, -size / 4);
      ctx.lineTo(0, 0);
      ctx.lineTo(-size / 2, -size / 4);
      ctx.closePath();
      ctx.stroke();
      
      // Right face
      ctx.beginPath();
      ctx.moveTo(size / 2, -size / 4);
      ctx.lineTo(size / 2, size / 4);
      ctx.lineTo(0, size / 2);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.stroke();
      
      // Left face
      ctx.beginPath();
      ctx.moveTo(-size / 2, -size / 4);
      ctx.lineTo(-size / 2, size / 4);
      ctx.lineTo(0, size / 2);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.stroke();
      
      ctx.restore();
    };
    
    const animate = () => {
      // Clear canvas completely each frame for consistent background
      ctx.fillStyle = 'rgb(5, 10, 18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw and animate isometric shapes
      shapes.forEach(shape => {
        shape.rotation += shape.rotationSpeed;
        drawIsometricCube(shape.x, shape.y, shape.size, shape.rotation, shape.opacity);
      });

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(94, 161, 240, 0.6)';
        ctx.fill();

        // Draw connections
        particles.slice(i + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.4;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(94, 161, 240, ${opacity})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* Gradient background - Almost black blue */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#050a12',
        ...style
      }} />
      
      {/* Canvas for animated lines */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
    </>
  );
}
