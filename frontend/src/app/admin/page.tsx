'use client';

import React from 'react';
import { User, BookOpen, Users, Settings, BarChart3, Calendar } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Admin Dashboard - Ôn luyện Vật lí 12
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-700">
                <User className="h-4 w-4 mr-2" />
                <span>Admin User</span>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Chào mừng đến với Bảng điều khiển Quản trị
              </h2>
              <p className="text-gray-600">
                Quản lý hệ thống học tập vật lý lớp 12 một cách hiệu quả và thông minh.
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Tổng học sinh
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">1,247</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Bài học
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">156</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Bài kiểm tra
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">89</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Hoạt động hôm nay
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">342</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Thao tác nhanh
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <button className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Users className="h-6 w-6 text-blue-600 mr-3" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Quản lý học sinh</div>
                    <div className="text-sm text-gray-500">Xem và chỉnh sửa thông tin học sinh</div>
                  </div>
                </button>

                <button className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <BookOpen className="h-6 w-6 text-green-600 mr-3" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Quản lý bài học</div>
                    <div className="text-sm text-gray-500">Tạo và chỉnh sửa nội dung bài học</div>
                  </div>
                </button>

                <button className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <BarChart3 className="h-6 w-6 text-yellow-600 mr-3" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Báo cáo thống kê</div>
                    <div className="text-sm text-gray-500">Xem báo cáo tiến độ học tập</div>
                  </div>
                </button>

                <button className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Settings className="h-6 w-6 text-purple-600 mr-3" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Cài đặt hệ thống</div>
                    <div className="text-sm text-gray-500">Cấu hình và tùy chỉnh hệ thống</div>
                  </div>
                </button>

                <button className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Calendar className="h-6 w-6 text-indigo-600 mr-3" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Lịch học</div>
                    <div className="text-sm text-gray-500">Quản lý lịch học và sự kiện</div>
                  </div>
                </button>

                <button className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <User className="h-6 w-6 text-red-600 mr-3" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Hồ sơ cá nhân</div>
                    <div className="text-sm text-gray-500">Cập nhật thông tin cá nhân</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
