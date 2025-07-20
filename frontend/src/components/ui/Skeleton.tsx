import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              variantClasses.text,
              index === lines - 1 ? 'w-3/4' : 'w-full',
              index > 0 && 'mt-2'
            )}
            style={index === 0 ? style : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  );
}

// Predefined skeleton components
export function TextSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return <Skeleton variant="text" lines={lines} className={className} />;
}

export function AvatarSkeleton({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 border border-gray-200 rounded-lg', className)}>
      <div className="flex items-center space-x-4 mb-4">
        <AvatarSkeleton size={48} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton variant="text" width="40%" height={14} className="mt-2" />
        </div>
      </div>
      <TextSkeleton lines={3} />
      <div className="flex justify-between items-center mt-4">
        <Skeleton width={80} height={32} />
        <Skeleton width={60} height={20} />
      </div>
    </div>
  );
}

export function LessonCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 bg-white border border-gray-200 rounded-lg shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton width="80%" height={20} className="mb-2" />
          <Skeleton width="60%" height={16} />
        </div>
        <Skeleton variant="circular" width={24} height={24} />
      </div>
      
      {/* Content */}
      <TextSkeleton lines={2} className="mb-4" />
      
      {/* Tags */}
      <div className="flex gap-2 mb-4">
        <Skeleton width={60} height={24} />
        <Skeleton width={80} height={24} />
        <Skeleton width={70} height={24} />
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skeleton variant="circular" width={16} height={16} />
          <Skeleton width={80} height={16} />
        </div>
        <Skeleton width={100} height={32} />
      </div>
    </div>
  );
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  className 
}: { 
  rows?: number; 
  columns?: number; 
  className?: string; 
}) {
  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="flex space-x-4 p-4 border-b border-gray-200">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} width="100%" height={16} className="flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 p-4 border-b border-gray-100">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              width="100%" 
              height={14} 
              className="flex-1" 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ 
  items = 5, 
  showAvatar = true, 
  className 
}: { 
  items?: number; 
  showAvatar?: boolean; 
  className?: string; 
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4">
          {showAvatar && <AvatarSkeleton size={40} />}
          <div className="flex-1">
            <Skeleton width="70%" height={16} className="mb-2" />
            <Skeleton width="50%" height={14} />
          </div>
          <Skeleton width={80} height={32} />
        </div>
      ))}
    </div>
  );
}
