'use client';

import { useState } from 'react';
import { Navigation, HeroSection, FeaturesSection, ShowcaseSection } from '@/components/layout';
import { NetworkAnimation, UserInfoModal } from '@/components/ui';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleQuizGameClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* Background Network Animation */}
      <NetworkAnimation />

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Features Section */}
        <FeaturesSection onQuizGameClick={handleQuizGameClick} />

        {/* Showcase Section */}
        <ShowcaseSection />
      </main>

      {/* User Info Modal */}
      <UserInfoModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        redirectTo="/quizgame"
      />
    </>
  );
}
