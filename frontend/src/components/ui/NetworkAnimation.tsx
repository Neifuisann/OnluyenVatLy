'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface NetworkAnimationProps {
  className?: string;
  nodeCount?: number;
  connectionDistance?: number;
  color?: string;
}

export default function NetworkAnimation({ 
  className = '',
  nodeCount = 50,
  connectionDistance = 200,
  color = '#4e54c8'
}: NetworkAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isAnimatingRef = useRef(true);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  const initNodes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    nodesRef.current = [];
    for (let i = 0; i < nodeCount; i++) {
      nodesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      });
    }
  }, [nodeCount]);

  const drawNode = useCallback((ctx: CanvasRenderingContext2D, node: Node) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [color]);

  const drawConnection = useCallback((ctx: CanvasRenderingContext2D, node1: Node, node2: Node, distance: number) => {
    const opacity = 1 - (distance / connectionDistance);
    ctx.beginPath();
    ctx.moveTo(node1.x, node1.y);
    ctx.lineTo(node2.x, node2.y);
    ctx.strokeStyle = `rgba(78, 84, 200, ${opacity * 0.5})`;
    ctx.lineWidth = 0.3;
    ctx.stroke();
  }, [connectionDistance]);

  const updateNodes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    nodesRef.current.forEach(node => {
      // Update position
      node.x += node.vx;
      node.y += node.vy;

      // Bounce off walls
      if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
      if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

      // Mouse interaction
      const dx = mouseRef.current.x - node.x;
      const dy = mouseRef.current.y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 120) {
        node.x -= dx * 0.02;
        node.y -= dy * 0.02;
      }
    });
  }, []);

  const drawConnections = useCallback((ctx: CanvasRenderingContext2D) => {
    const nodes = nodesRef.current;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance) {
          drawConnection(ctx, nodes[i], nodes[j], distance);
        }
      }
    }
  }, [connectionDistance, drawConnection]);

  const animate = useCallback(() => {
    if (!isAnimatingRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw
    updateNodes();
    drawConnections(ctx);
    nodesRef.current.forEach(node => drawNode(ctx, node));

    // Request next frame
    animationRef.current = requestAnimationFrame(animate);
  }, [updateNodes, drawConnections, drawNode]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set initial size
    resize();
    
    // Initialize nodes
    initNodes();
    
    // Start animation
    animate();

    // Event listeners
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      isAnimatingRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [resize, initNodes, animate, handleMouseMove]);

  return (
    <canvas
      ref={canvasRef}
      className={`network-canvas ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
}
