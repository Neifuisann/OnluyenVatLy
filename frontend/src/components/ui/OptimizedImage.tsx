'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { getImageProps, isBase64Image, isExternalImage } from '@/utils/assets';
import { LoadingSpinner } from './LoadingSpinner';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
  className?: string;
  fallbackSrc?: string;
  showLoadingSpinner?: boolean;
  onClick?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
}

/**
 * Optimized Image component that handles:
 * - Next.js Image optimization for local assets
 * - Fallback for base64 and external images
 * - Loading states and error handling
 * - Responsive sizing
 */
export function OptimizedImage({
  src,
  alt,
  width = 800,
  height = 600,
  priority = false,
  sizes,
  className = '',
  fallbackSrc,
  showLoadingSpinner = true,
  onClick,
  style,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    
    // Try fallback if available
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setIsLoading(true);
      setHasError(false);
    }
  };

  const imageProps = getImageProps(currentSrc, alt, {
    width,
    height,
    priority,
    sizes,
  });

  // For base64 or external images, use regular img tag
  if (isBase64Image(currentSrc) || isExternalImage(currentSrc) || hasError) {
    return (
      <div className={`relative ${className}`} style={style}>
        {isLoading && showLoadingSpinner && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <LoadingSpinner size="sm" />
          </div>
        )}
        
        {hasError && !fallbackSrc ? (
          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 min-h-[200px]">
            <div className="text-center">
              <div className="text-2xl mb-2">🖼️</div>
              <div className="text-sm">Image not available</div>
            </div>
          </div>
        ) : (
          <img
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
            onLoad={handleLoad}
            onError={handleError}
            onClick={onClick}
            style={{
              maxWidth: '100%',
              height: 'auto',
              ...style,
            }}
          />
        )}
      </div>
    );
  }

  // Use Next.js Image component for local assets
  return (
    <div className={`relative ${className}`} style={style}>
      {isLoading && showLoadingSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
          <LoadingSpinner size="sm" />
        </div>
      )}
      
      <Image
        {...imageProps}
        alt={alt || 'Optimized image'}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        style={{
          objectFit: 'cover',
          ...style,
        }}
      />
    </div>
  );
}

/**
 * Lesson Image component with specific optimizations for lesson images
 */
export function LessonImage({
  lessonId,
  lessonImage,
  alt,
  className = '',
  onClick,
  ...props
}: {
  lessonId?: string | number;
  lessonImage?: string;
  alt: string;
  className?: string;
  onClick?: () => void;
} & Partial<OptimizedImageProps>) {
  // Determine the image source
  let imageSrc = lessonImage;
  
  // If no lesson image provided but we have a lesson ID, use default lesson image
  if (!imageSrc && lessonId) {
    imageSrc = `/images/lesson${lessonId}.jpg`;
  }
  
  // Fallback to a default lesson image
  const fallbackSrc = '/images/lesson1.jpg';
  
  return (
    <OptimizedImage
      src={imageSrc || fallbackSrc}
      alt={alt}
      fallbackSrc={fallbackSrc}
      className={`lesson-image ${className}`}
      onClick={onClick}
      {...props}
    />
  );
}

/**
 * Lesson Handout Image component for lesson materials
 */
export function LessonHandoutImage({
  lessonNumber,
  alt,
  className = '',
  onClick,
  ...props
}: {
  lessonNumber: number;
  alt: string;
  className?: string;
  onClick?: () => void;
} & Partial<OptimizedImageProps>) {
  const imageSrc = `/lesson_handout/${lessonNumber}.jpg`;
  
  return (
    <OptimizedImage
      src={imageSrc}
      alt={alt}
      className={`lesson-handout-image ${className}`}
      onClick={onClick}
      {...props}
    />
  );
}

/**
 * Avatar Image component with circular styling
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  className = '',
  fallbackInitials,
  ...props
}: {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
  fallbackInitials?: string;
} & Partial<OptimizedImageProps>) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        {fallbackInitials || alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      showLoadingSpinner={false}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}
