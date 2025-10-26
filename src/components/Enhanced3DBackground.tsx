import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const Enhanced3DBackground: React.FC = () => {
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

    // 3D Particle System
    class Particle3D {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      size: number;
      color: string;
      life: number;
      maxLife: number;

      constructor() {
        this.x = (Math.random() - 0.5) * canvas.width;
        this.y = (Math.random() - 0.5) * canvas.height;
        this.z = Math.random() * 1000;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.vz = -Math.random() * 5 - 1;
        this.size = Math.random() * 3 + 1;
        this.color = `hsl(${200 + Math.random() * 60}, 70%, ${50 + Math.random() * 30}%)`;
        this.life = this.maxLife = Math.random() * 200 + 100;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        this.life--;

        if (this.z <= 0 || this.life <= 0) {
          this.x = (Math.random() - 0.5) * canvas.width;
          this.y = (Math.random() - 0.5) * canvas.height;
          this.z = 1000;
          this.life = this.maxLife;
        }
      }

      draw() {
        const scale = 500 / (500 + this.z);
        const x2d = this.x * scale + canvas.width / 2;
        const y2d = this.y * scale + canvas.height / 2;
        const size2d = this.size * scale;
        const alpha = (this.life / this.maxLife) * scale;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(x2d, y2d, size2d, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Neural Network Connections
    class NeuralConnection {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      pulse: number;
      speed: number;

      constructor() {
        this.x1 = Math.random() * canvas.width;
        this.y1 = Math.random() * canvas.height;
        this.x2 = Math.random() * canvas.width;
        this.y2 = Math.random() * canvas.height;
        this.pulse = 0;
        this.speed = 0.02 + Math.random() * 0.03;
      }

      update() {
        this.pulse += this.speed;
        if (this.pulse > 1) this.pulse = 0;
      }

      draw() {
        const gradient = ctx.createLinearGradient(this.x1, this.y1, this.x2, this.y2);
        gradient.addColorStop(0, `rgba(59, 130, 246, ${0.1 + this.pulse * 0.3})`);
        gradient.addColorStop(0.5, `rgba(147, 197, 253, ${0.3 + this.pulse * 0.5})`);
        gradient.addColorStop(1, `rgba(59, 130, 246, ${0.1 + this.pulse * 0.3})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1 + this.pulse * 2;
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();

        // Pulse dot
        const pulseX = this.x1 + (this.x2 - this.x1) * this.pulse;
        const pulseY = this.y1 + (this.y2 - this.y1) * this.pulse;
        
        ctx.fillStyle = `rgba(34, 197, 94, ${0.8 + Math.sin(this.pulse * Math.PI) * 0.2})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(34, 197, 94, 0.8)';
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, 3 + Math.sin(this.pulse * Math.PI) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Geometric Shapes
    class FloatingGeometry {
      x: number;
      y: number;
      z: number;
      rotationX: number;
      rotationY: number;
      rotationZ: number;
      size: number;
      type: 'cube' | 'pyramid' | 'sphere';

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.z = Math.random() * 500 + 100;
        this.rotationX = 0;
        this.rotationY = 0;
        this.rotationZ = 0;
        this.size = Math.random() * 30 + 10;
        this.type = ['cube', 'pyramid', 'sphere'][Math.floor(Math.random() * 3)] as any;
      }

      update() {
        this.rotationX += 0.01;
        this.rotationY += 0.015;
        this.rotationZ += 0.008;
        this.y += Math.sin(Date.now() * 0.001 + this.x * 0.01) * 0.5;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const alpha = Math.max(0.1, 1 - this.z / 500);
        ctx.globalAlpha = alpha * 0.3;

        switch (this.type) {
          case 'cube':
            this.drawCube();
            break;
          case 'pyramid':
            this.drawPyramid();
            break;
          case 'sphere':
            this.drawSphere();
            break;
        }
        
        ctx.restore();
      }

      drawCube() {
        const size = this.size;
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-size/2, -size/2, size, size);
        
        // 3D effect
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.4)';
        ctx.beginPath();
        ctx.moveTo(-size/2, -size/2);
        ctx.lineTo(-size/2 + 10, -size/2 - 10);
        ctx.lineTo(size/2 + 10, -size/2 - 10);
        ctx.lineTo(size/2, -size/2);
        ctx.stroke();
      }

      drawPyramid() {
        const size = this.size;
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size/2, size/2);
        ctx.lineTo(size/2, size/2);
        ctx.closePath();
        ctx.stroke();
      }

      drawSphere() {
        const size = this.size;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size/2);
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0.1)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size/2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize systems
    const particles: Particle3D[] = [];
    const connections: NeuralConnection[] = [];
    const geometries: FloatingGeometry[] = [];

    for (let i = 0; i < 150; i++) {
      particles.push(new Particle3D());
    }

    for (let i = 0; i < 8; i++) {
      connections.push(new NeuralConnection());
    }

    for (let i = 0; i < 6; i++) {
      geometries.push(new FloatingGeometry());
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
      gradient.addColorStop(0.5, 'rgba(30, 58, 138, 0.85)');
      gradient.addColorStop(1, 'rgba(67, 56, 202, 0.95)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw neural connections
      connections.forEach(connection => {
        connection.update();
        connection.draw();
      });

      // Update and draw 3D particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Update and draw floating geometries
      geometries.forEach(geometry => {
        geometry.update();
        geometry.draw();
      });

      // Add scanning line effect
      const scanY = (Date.now() * 0.1) % canvas.height;
      const scanGradient = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 2);
      scanGradient.addColorStop(0, 'rgba(59, 130, 246, 0)');
      scanGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.3)');
      scanGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      
      ctx.fillStyle = scanGradient;
      ctx.fillRect(0, scanY - 2, canvas.width, 4);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <>
      {/* 3D Canvas Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: -1 }}
      />
      
      {/* Additional 3D CSS Effects */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
        {/* Floating Orbs */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-32 h-32 rounded-full opacity-20"
            style={{
              background: `radial-gradient(circle, ${
                ['#3b82f6', '#8b5cf6', '#06d6a0', '#f72585', '#4cc9f0'][i]
              }40, transparent)`,
              left: `${20 + i * 15}%`,
              top: `${10 + i * 20}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Geometric Patterns */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1000 1000">
            <defs>
              <pattern id="hexPattern" x="0" y="0" width="100" height="87" patternUnits="userSpaceOnUse">
                <polygon
                  points="50,0 93.3,25 93.3,75 50,100 6.7,75 6.7,25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.3"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexPattern)" className="text-blue-400" />
          </svg>
        </div>

        {/* Data Flow Lines */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            style={{
              width: '100%',
              top: `${30 + i * 25}%`,
            }}
            animate={{
              scaleX: [0, 1, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </>
  );
};