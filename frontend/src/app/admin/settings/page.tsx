'use client';

import React, { useState } from 'react';
import { Settings, User, Bell, Shield, Database, Globe, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'Cài đặt chung', icon: Settings },
    { id: 'users', name: 'Quản lý người dùng', icon: User },
    { id: 'notifications', name: 'Thông báo', icon: Bell },
    { id: 'security', name: 'Bảo mật', icon: Shield },
    { id: 'database', name: 'Cơ sở dữ liệu', icon: Database },
    { id: 'system', name: 'Hệ thống', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link 
                href="/admin" 
                className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Quay lại
              </Link>
              <Settings className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-semibold text-gray-900">
                Cài đặt Hệ thống
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Save className="h-4 w-4 mr-2" />
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="flex">
              {/* Sidebar */}
              <div className="w-64 bg-gray-50 border-r">
                <nav className="p-4 space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {tab.name}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Content */}
              <div className="flex-1 p-6">
                {activeTab === 'general' && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Cài đặt chung</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tên hệ thống
                        </label>
                        <input
                          type="text"
                          defaultValue="Ôn luyện Vật lí 12 - Next Gen Learning"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mô tả hệ thống
                        </label>
                        <textarea
                          rows={3}
                          defaultValue="Học tập thông minh chỉ với 5 phút mỗi ngày, chinh phục mọi thử thách vật lý 🚀"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Múi giờ
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="Asia/Ho_Chi_Minh">Việt Nam (UTC+7)</option>
                          <option value="Asia/Bangkok">Bangkok (UTC+7)</option>
                          <option value="Asia/Singapore">Singapore (UTC+8)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'users' && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Quản lý người dùng</h2>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Cho phép đăng ký mới</h3>
                          <p className="text-sm text-gray-500">Học sinh có thể tự đăng ký tài khoản</p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Xác thực email</h3>
                          <p className="text-sm text-gray-500">Yêu cầu xác thực email khi đăng ký</p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Số lượng học sinh tối đa
                        </label>
                        <input
                          type="number"
                          defaultValue="5000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Cài đặt thông báo</h2>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Email thông báo</h3>
                          <p className="text-sm text-gray-500">Gửi email thông báo cho học sinh</p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Thông báo push</h3>
                          <p className="text-sm text-gray-500">Gửi thông báo đẩy qua trình duyệt</p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Cài đặt bảo mật</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Thời gian hết hạn phiên đăng nhập (phút)
                        </label>
                        <input
                          type="number"
                          defaultValue="60"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Xác thực hai yếu tố</h3>
                          <p className="text-sm text-gray-500">Bắt buộc 2FA cho tài khoản admin</p>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'database' && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Cài đặt cơ sở dữ liệu</h2>
                    <div className="space-y-6">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <Database className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              Cảnh báo
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>
                                Thay đổi cài đặt cơ sở dữ liệu có thể ảnh hưởng đến hiệu suất hệ thống.
                                Vui lòng liên hệ với quản trị viên hệ thống trước khi thực hiện.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'system' && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Thông tin hệ thống</h2>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phiên bản</label>
                          <p className="mt-1 text-sm text-gray-900">v1.0.0</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Cập nhật lần cuối</label>
                          <p className="mt-1 text-sm text-gray-900">19/07/2025</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                          <p className="mt-1 text-sm text-green-600">Hoạt động bình thường</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Uptime</label>
                          <p className="mt-1 text-sm text-gray-900">15 ngày 4 giờ</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
