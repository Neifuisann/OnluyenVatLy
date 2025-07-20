'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, User, LogIn, GraduationCap, Book } from 'lucide-react';

// Form validation schema
const loginSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập không được để trống'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Auto-focus username field
  useEffect(() => {
    setFocus('username');
  }, [setFocus]);

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setLoginError(null);

    try {
      // Simulate login process
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Login data:', data);

      // Simulate different responses based on credentials
      if (data.username === 'admin' && (data.password === 'admin123' || data.password === 'password')) {
        // Simulate successful login with redirect
        console.log('Login successful');
        setLoginError(null);

        // Get redirect URL from search params or default to admin
        const redirectUrl = searchParams.get('redirect') || '/admin';
        console.log('Redirecting to:', redirectUrl);

        // Redirect after a short delay to show success
        setTimeout(() => {
          router.push(redirectUrl);
        }, 500);
      } else {
        // Simulate login error
        setLoginError('Tên đăng nhập hoặc mật khẩu không đúng');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div
      data-testid="login-background"
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      {/* Login form */}
      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 backdrop-blur-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6 shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Admin Login</h1>
            <p className="text-gray-500 text-lg">Đăng nhập để quản lý hệ thống</p>
          </div>

          {/* Error message */}
          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg flex items-center gap-3 text-red-700 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <span className="text-sm font-medium">{loginError}</span>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Username field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                Tên đăng nhập
              </label>
              <div className="relative">
                <input
                  {...register('username')}
                  type="text"
                  id="username"
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-lg bg-gray-50 hover:bg-white"
                  placeholder="Nhập tên đăng nhập"
                />
                <User className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {errors.username && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.username.message}</p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300 text-lg bg-gray-50 hover:bg-white"
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  data-testid="toggle-password"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg transform hover:scale-[1.02] active:scale-[0.98] ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200'
              } text-white`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <LogIn className="w-6 h-6" />
                  Đăng nhập
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-6 text-gray-400 text-sm font-medium bg-white">HOẶC</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Alternative links */}
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/student/login"
              className="flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-200 rounded-xl text-green-700 hover:text-green-800 transition-all duration-300 text-sm font-semibold shadow-sm hover:shadow-md transform hover:scale-[1.02]"
            >
              <GraduationCap className="w-5 h-5" />
              Học sinh
            </a>
            <a
              href="/gallery"
              className="flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 border-2 border-purple-200 rounded-xl text-purple-700 hover:text-purple-800 transition-all duration-300 text-sm font-semibold shadow-sm hover:shadow-md transform hover:scale-[1.02]"
            >
              <Book className="w-5 h-5" />
              Lý thuyết
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}