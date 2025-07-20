'use client';

import { OptimizedImage } from '@/components/ui';

interface ShowcaseItemProps {
  title: string;
  imageSrc: string;
  imageAlt: string;
}

interface ShowcaseSectionProps {
  className?: string;
}

const ShowcaseItem = ({ title, imageSrc, imageAlt }: ShowcaseItemProps) => {
  // Fallback SVG for missing images
  const fallbackSrc = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23667eea'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='24' fill='white'%3E${encodeURIComponent(title)}%3C/text%3E%3C/svg%3E`;

  return (
    <div className="showcase-item">
      <OptimizedImage
        src={imageSrc}
        alt={imageAlt}
        width={400}
        height={300}
        className="showcase-image"
        onError={() => {
          // Error handling is done internally by OptimizedImage
        }}
      />
      <div className="showcase-overlay">
        <h3>{title}</h3>
      </div>
    </div>
  );
};

export default function ShowcaseSection({ className = '' }: ShowcaseSectionProps) {
  const showcaseItems = [
    {
      title: 'Nhiệt học',
      imageSrc: '/images/lesson1.jpg',
      imageAlt: 'Nhiệt học'
    },
    {
      title: 'Điện học',
      imageSrc: '/images/lesson2.jpg',
      imageAlt: 'Điện học'
    },
    {
      title: 'Quang học',
      imageSrc: '/images/lesson3.jpg',
      imageAlt: 'Quang học'
    },
    {
      title: 'Cơ học',
      imageSrc: '/images/lesson4.jpg',
      imageAlt: 'Cơ học'
    },
    {
      title: 'Hạt nhân',
      imageSrc: '/images/lesson5.jpg',
      imageAlt: 'Vật lý hạt nhân'
    },
    {
      title: 'Dao động sóng',
      imageSrc: '/images/lesson6.jpg',
      imageAlt: 'Dao động và sóng'
    }
  ];

  return (
    <section className={`showcase-section ${className}`}>
      <h2 className="showcase-title">Khám phá bài học</h2>
      <div className="showcase-grid">
        {showcaseItems.map((item, index) => (
          <ShowcaseItem
            key={index}
            title={item.title}
            imageSrc={item.imageSrc}
            imageAlt={item.imageAlt}
          />
        ))}
      </div>
    </section>
  );
}
