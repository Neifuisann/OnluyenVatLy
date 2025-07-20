'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}

interface StudentInfo {
  name: string;
  dob: string;
  id: string;
  studentId: string;
}

export default function UserInfoModal({ 
  isOpen, 
  onClose, 
  redirectTo = '/quizgame' 
}: UserInfoModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.dob || !formData.id) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create student info object
      const studentInfo: StudentInfo = {
        name: formData.name,
        dob: formData.dob,
        id: formData.id,
        studentId: formData.id // Adding this for consistency with other parts of the app
      };

      // Store in both localStorage and sessionStorage
      localStorage.setItem('studentInfo', JSON.stringify(studentInfo));
      sessionStorage.setItem('studentInfo', JSON.stringify(studentInfo));

      // Close modal first
      onClose();

      // Small delay to ensure modal closes before redirect
      setTimeout(() => {
        // Only redirect if the route exists (not during testing)
        if (redirectTo !== '/quizgame') {
          router.push(redirectTo);
        } else {
          // For quiz game, just log for now since the route doesn't exist yet
          console.log('Quiz game functionality - student info saved:', studentInfo);
        }
      }, 100);
    } catch (error) {
      console.error('Error saving student info:', error);
      alert('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`modal ${isOpen ? 'active' : ''}`} 
      id="user-info-modal"
      onClick={handleBackdropClick}
    >
      <div className="modal-content">
        <div className="modal-header">
          <div className="modal-icon">
            <i className="fas fa-user-graduate"></i>
          </div>
          <h2>Thông tin học sinh</h2>
          <p>Vui lòng nhập thông tin để bắt đầu</p>
        </div>
        
        <form id="user-info-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="student-name">Họ và tên:</label>
            <input
              type="text"
              id="student-name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Nhập họ và tên"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="student-dob">Ngày sinh:</label>
            <input
              type="date"
              id="student-dob"
              name="dob"
              value={formData.dob}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="student-id">Mã học sinh:</label>
            <input
              type="text"
              id="student-id"
              name="id"
              value={formData.id}
              onChange={handleInputChange}
              required
              placeholder="Nhập mã học sinh"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="modal-actions">
            <button 
              type="button" 
              className="button secondary" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="button primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Bắt đầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
