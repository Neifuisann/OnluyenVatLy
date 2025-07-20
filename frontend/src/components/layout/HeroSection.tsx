'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

interface HeroSectionProps {
  className?: string;
}

export default function HeroSection({ className = '' }: HeroSectionProps) {
  const heroRef = useRef<HTMLElement>(null);

  // Parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.pageYOffset;
        heroRef.current.style.transform = `translateY(${scrolled * 0.5}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const titleWords = ['Ôn', 'luyện', 'Vật', 'lí', '12'];

  return (
    <section ref={heroRef} className={`hero-section ${className}`}>
      {/* Floating Elements */}
      <div className="floating-elements">
        <div className="floating-element">⚛️</div>
        <div className="floating-element">🧪</div>
        <div className="floating-element">🔬</div>
        <div className="floating-element">📐</div>
        <div className="floating-element">💡</div>
      </div>
      
      <div className="hero-content">
        <h1 className="hero-title">
          {titleWords.map((word, index) => (
            <span key={index} style={{ animationDelay: `${index * 0.1}s` }}>
              {word}{index < titleWords.length - 1 ? ' ' : ''}
            </span>
          ))}
        </h1>
        
        <p className="hero-subtitle">
          Học tập thông minh chỉ với 5 phút mỗi ngày, chinh phục mọi thử thách vật lý 🚀
        </p>
        
        <div className="hero-cta">
          <Link href="/lessons" className="button primary">
            <i className="fas fa-rocket"></i>
            Bắt đầu ngay
          </Link>
          <Link href="/gallery" className="button secondary">
            <i className="fas fa-book-open"></i>
            Xem bài học
          </Link>
        </div>
      </div>
    </section>
  );
}
