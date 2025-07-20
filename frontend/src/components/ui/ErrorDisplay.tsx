import { cn } from '@/lib/utils';

export interface ErrorDisplayProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
  variant?: 'default' | 'minimal' | 'card';
  showDetails?: boolean;
}

export function ErrorDisplay({
  title = 'Đã xảy ra lỗi',
  message,
  error,
  onRetry,
  retryText = 'Thử lại',
  className,
  variant = 'default',
  showDetails = false,
}: ErrorDisplayProps) {
  const errorMessage = error 
    ? typeof error === 'string' 
      ? error 
      : error.message
    : message;

  const baseClasses = 'text-center';
  
  const variantClasses = {
    default: 'p-6 bg-red-50 border border-red-200 rounded-lg',
    minimal: 'p-4',
    card: 'p-6 bg-white shadow-lg rounded-lg border border-red-200',
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      {errorMessage && (
        <p className="text-sm text-gray-600 mb-4">
          {errorMessage}
        </p>
      )}
      
      {showDetails && error && typeof error !== 'string' && error.stack && (
        <details className="mb-4 text-left">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            Chi tiết lỗi
          </summary>
          <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto max-h-32">
            {error.stack}
          </pre>
        </details>
      )}
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          {retryText}
        </button>
      )}
    </div>
  );
}

// Specific error components
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      title="Lỗi kết nối"
      message="Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet và thử lại."
      onRetry={onRetry}
      variant="card"
    />
  );
}

export function NotFoundError({ message, onGoBack }: { 
  message?: string; 
  onGoBack?: () => void; 
}) {
  return (
    <ErrorDisplay
      title="Không tìm thấy"
      message={message || "Trang hoặc nội dung bạn tìm kiếm không tồn tại."}
      onRetry={onGoBack}
      retryText="Quay lại"
      variant="card"
    />
  );
}

export function UnauthorizedError({ onLogin }: { onLogin?: () => void }) {
  return (
    <ErrorDisplay
      title="Không có quyền truy cập"
      message="Bạn cần đăng nhập để truy cập nội dung này."
      onRetry={onLogin}
      retryText="Đăng nhập"
      variant="card"
    />
  );
}

export function ValidationError({ errors }: { errors: string[] }) {
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Vui lòng kiểm tra lại thông tin
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
