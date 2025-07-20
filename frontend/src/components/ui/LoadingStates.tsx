import React from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from './LoadingSpinner';
import { Skeleton } from './Skeleton';

export interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function LoadingState({
  isLoading,
  children,
  fallback,
  className,
}: LoadingStateProps) {
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-4', className)}>
        {fallback || <LoadingSpinner />}
      </div>
    );
  }

  return <>{children}</>;
}

// Page-level loading component
export function PageLoading({ message = 'Đang tải...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
}

// Section loading component
export function SectionLoading({ 
  message = 'Đang tải...', 
  className 
}: { 
  message?: string; 
  className?: string; 
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <LoadingSpinner size="md" />
      <p className="mt-4 text-sm text-gray-600">{message}</p>
    </div>
  );
}

// Button loading state
export function ButtonLoading({ 
  isLoading, 
  children, 
  loadingText = 'Đang xử lý...', 
  className,
  ...props 
}: {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center',
        isLoading && 'cursor-not-allowed opacity-75',
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Data loading with skeleton
export function DataLoading({
  isLoading,
  children,
  skeleton,
  error,
  onRetry,
  className,
}: {
  isLoading: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  error?: string | Error;
  onRetry?: () => void;
  className?: string;
}) {
  if (error) {
    return (
      <div className={cn('p-4 text-center', className)}>
        <div className="text-red-600 mb-4">
          {typeof error === 'string' ? error : error.message}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Thử lại
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={className}>
        {skeleton || <Skeleton height={200} />}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

// List loading with skeleton items
export function ListLoading({
  isLoading,
  children,
  itemCount = 5,
  itemSkeleton,
  className,
}: {
  isLoading: boolean;
  children: React.ReactNode;
  itemCount?: number;
  itemSkeleton?: React.ReactNode;
  className?: string;
}) {
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: itemCount }).map((_, index) => (
          <div key={index}>
            {itemSkeleton || (
              <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1">
                  <Skeleton width="60%" height={16} className="mb-2" />
                  <Skeleton width="40%" height={14} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

// Progressive loading for images
export function ImageLoading({
  src,
  alt,
  className,
  skeletonClassName,
  ...props
}: {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  [key: string]: unknown;
}) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  return (
    <div className="relative">
      {isLoading && (
        <Skeleton
          className={cn('absolute inset-0', skeletonClassName)}
        />
      )}
      
      {hasError ? (
        <div className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          className
        )}>
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      ) : (
        <img
          src={src}
          alt={alt || 'Loading image'}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          {...props}
        />
      )}
    </div>
  );
}
