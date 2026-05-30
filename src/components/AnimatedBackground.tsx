import { useEffect, useRef } from 'react';

export function AnimatedBackground() {
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

    // Floating geometric shapes
    interface Shape {
      x: number;
      y: number;
      size: number;
      rotation: number;
      rotationSpeed: number;
      speedX: number;
      speedY: number;
      type: 'box' | 'circle' | 'triangle';
      color: string;
    }

    const shapes: Shape[] = [];
    const shapeCount = 15;
    const colors = [
      'rgba(14, 165, 233, 0.15)',  // cyan
      'rgba(168, 85, 247, 0.15)',  // purple
      'rgba(6, 182, 212, 0.15)',   // teal
      'rgba(99, 102, 241, 0.15)',  // indigo
    ];

    // Initialize shapes
    for (let i = 0; i < shapeCount; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 60 + 30,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        type: ['box', 'circle', 'triangle'][Math.floor(Math.random() * 3)] as Shape['type'],
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Draw shapes
    const drawShape = (shape: Shape) => {
      ctx.save();
      ctx.translate(shape.x, shape.y);
      ctx.rotate(shape.rotation);
      ctx.fillStyle = shape.color;
      ctx.strokeStyle = shape.color.replace('0.15', '0.3');
      ctx.lineWidth = 2;

      switch (shape.type) {
        case 'box':
          ctx.strokeRect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 'triangle':
          ctx.beginPath();
          ctx.moveTo(0, -shape.size / 2);
          ctx.lineTo(-shape.size / 2, shape.size / 2);
          ctx.lineTo(shape.size / 2, shape.size / 2);
          ctx.closePath();
          ctx.stroke();
          break;
      }

      ctx.restore();
    };

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      shapes.forEach((shape) => {
        // Update position
        shape.x += shape.speedX;
        shape.y += shape.speedY;
        shape.rotation += shape.rotationSpeed;

        // Wrap around screen
        if (shape.x < -shape.size) shape.x = canvas.width + shape.size;
        if (shape.x > canvas.width + shape.size) shape.x = -shape.size;
        if (shape.y < -shape.size) shape.y = canvas.height + shape.size;
        if (shape.y > canvas.height + shape.size) shape.y = -shape.size;

        drawShape(shape);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.4 }}
    />
  );
}
