import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface MetroBackgroundProps {
  className?: string;
}

export const MetroBackground: React.FC<MetroBackgroundProps> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Enhanced train animation variables
    let trainPosition = -200;
    const trainSpeed = 1.5;
    let animationId: number;

    // Enhanced metro lines animation with circuit patterns
    const lines = Array.from({ length: 12 }, (_, i) => ({
      y: (i + 1) * (canvas.height / 13),
      offset: Math.random() * 100,
      speed: 0.3 + Math.random() * 0.4,
      opacity: 0.1 + Math.random() * 0.2,
    }));

    // Particle system for enhanced effects
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5,
      size: Math.random() * 2 + 1,
    }));

    const animate = () => {
      // Create gradient background effect
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
      gradient.addColorStop(0.5, 'rgba(30, 58, 138, 0.85)');
      gradient.addColorStop(1, 'rgba(67, 56, 202, 0.95)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw enhanced metro circuit lines
      lines.forEach(line => {
        ctx.strokeStyle = `rgba(59, 130, 246, ${line.opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        for (let x = 0; x < canvas.width + 40; x += 40) {
          const y = line.y + Math.sin((x + line.offset) * 0.008) * 8;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          
          // Add circuit nodes
          if (x % 120 === 0) {
            ctx.fillStyle = `rgba(147, 197, 253, ${line.opacity * 2})`;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.stroke();
        line.offset += line.speed;
      });

      // Draw vertical circuit lines
      for (let x = 0; x < canvas.width; x += 80) {
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Enhanced train with glass morphism effect
      trainPosition += trainSpeed;
      if (trainPosition > canvas.width + 250) {
        trainPosition = -250;
      }

      const trainY = canvas.height * 0.75;
      
      // Train shadow/glow
      ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
      ctx.shadowBlur = 20;
      
      // Train body with gradient
      const trainGradient = ctx.createLinearGradient(trainPosition, trainY, trainPosition, trainY + 50);
      trainGradient.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
      trainGradient.addColorStop(1, 'rgba(37, 99, 235, 0.7)');
      
      ctx.fillStyle = trainGradient;
      ctx.fillRect(trainPosition, trainY, 220, 50);
      
      // Train glass effect overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(trainPosition, trainY, 220, 25);
      
      // Enhanced train windows with glass effect
      ctx.shadowBlur = 10;
      ctx.fillStyle = 'rgba(147, 197, 253, 0.8)';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(trainPosition + 15 + i * 40, trainY + 10, 30, 30);
        // Window glass reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(trainPosition + 15 + i * 40, trainY + 10, 30, 15);
        ctx.fillStyle = 'rgba(147, 197, 253, 0.8)';
      }

      // Enhanced train lights
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 15;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(trainPosition - 8, trainY + 20, 12, 10);

      // Reset shadow
      ctx.shadowBlur = 0;

      // Enhanced particle effects
      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        // Draw particle
        ctx.fillStyle = `rgba(147, 197, 253, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Pulse effect
        particle.opacity = 0.1 + Math.sin(Date.now() * 0.001 + particle.x * 0.01) * 0.3;
      });

      // Data flow effect along train path
      if (Math.random() > 0.8) {
        const dataX = trainPosition + Math.random() * 220;
        const dataY = trainY - 10;
        ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
        ctx.fillRect(dataX, dataY, 3, 6);
        
        // Data trail
        for (let i = 1; i < 5; i++) {
          ctx.fillStyle = `rgba(34, 197, 94, ${0.8 - i * 0.15})`;
          ctx.fillRect(dataX - i * 4, dataY, 2, 4);
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className={`fixed inset-0 ${className}`} style={{ zIndex: -1 }}>
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-transparent to-cyan-900/20"></div>
      </div>
      
      {/* Animated floating elements */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div 
        className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-gradient-to-r from-indigo-500/15 to-purple-500/15 rounded-full blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 60, 0],
          scale: [1, 0.8, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
};