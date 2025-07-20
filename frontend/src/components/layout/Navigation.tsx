'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationProps {
  className?: string;
}

export default function Navigation({ className = '' }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest('.main-nav')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  const navLinks = [
    {
      href: '/',
      icon: 'fas fa-home',
      label: 'Trang chủ',
      active: pathname === '/'
    },
    {
      href: '/lessons',
      icon: 'fas fa-book',
      label: 'Bài học',
      active: pathname === '/lessons'
    },
    {
      href: '/leaderboard',
      icon: 'fas fa-trophy',
      label: 'Bảng xếp hạng',
      active: pathname === '/leaderboard'
    },
    {
      href: '/profile',
      icon: 'fas fa-user',
      label: 'Hồ sơ',
      active: pathname === '/profile'
    }
  ];

  return (
    <nav className={`main-nav ${className}`}>
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          <i className="fas fa-atom"></i>
          <span>Học Vật Lý</span>
        </Link>
        
        <div className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`} id="nav-links">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${link.active ? 'active' : ''}`}
            >
              <i className={link.icon}></i>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
        
        <button 
          className="mobile-menu-toggle" 
          id="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </div>
    </nav>
  );
}
