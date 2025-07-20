'use client';

import { useRouter } from 'next/navigation';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  href: string;
  onClick?: () => void;
}

interface FeaturesSectionProps {
  className?: string;
  onQuizGameClick?: () => void;
}

const FeatureCard = ({ icon, title, description, href, onClick }: FeatureCardProps) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(href);
    }
  };

  return (
    <div className="feature-card" onClick={handleClick}>
      <div className="feature-icon">
        <i className={icon}></i>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export default function FeaturesSection({ className = '', onQuizGameClick }: FeaturesSectionProps) {
  const features = [
    {
      icon: 'fas fa-graduation-cap',
      title: 'Bài học chi tiết',
      description: 'Nắm vững kiến thức với hệ thống bài giảng được thiết kế khoa học, dễ hiểu',
      href: '/gallery'
    },
    {
      icon: 'fas fa-brain',
      title: 'Luyện tập thông minh',
      description: 'AI phân tích và đưa ra bài tập phù hợp với trình độ của bạn',
      href: '/lessons'
    },
    {
      icon: 'fas fa-gamepad',
      title: 'Trò chơi học tập',
      description: 'Học vật lý qua các trò chơi thú vị và tương tác',
      href: '/quizgame',
      isQuizGame: true
    },
    {
      icon: 'fas fa-trophy',
      title: 'Thành tích & Xếp hạng',
      description: 'Theo dõi tiến độ và cạnh tranh với bạn bè',
      href: '/leaderboard'
    },
    {
      icon: 'fas fa-chart-line',
      title: 'Phân tích chi tiết',
      description: 'Báo cáo chi tiết về điểm mạnh và điểm cần cải thiện',
      href: '/history'
    },
    {
      icon: 'fas fa-mobile-alt',
      title: 'Học mọi lúc mọi nơi',
      description: 'Giao diện thân thiện, tối ưu cho mọi thiết bị',
      href: '/lessons'
    }
  ];

  return (
    <section className={`features-section ${className}`}>
      <h2 className="text-center">Tính năng nổi bật</h2>
      <div className="features-grid">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            href={feature.href}
            onClick={feature.isQuizGame ? onQuizGameClick : undefined}
          />
        ))}
      </div>
    </section>
  );
}
