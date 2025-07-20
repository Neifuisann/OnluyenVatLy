# Phase 1 Quick Reference Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Git for version control

### Development Setup
```bash
# Clone the repository
git clone [repository-url]
cd OnluyenVatLy

# Install backend dependencies (if needed)
npm install

# Install frontend dependencies
cd frontend
npm install

# Start development servers
# Terminal 1: Backend
npm start

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Access URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3003
- **Database**: Supabase (cloud)

## 📁 Project Structure

```
OnluyenVatLy/
├── frontend/                    # Next.js frontend
│   ├── src/
│   │   ├── app/                # Pages (App Router)
│   │   ├── components/         # React components
│   │   │   ├── ui/            # Reusable UI components
│   │   │   └── layout/        # Layout components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Core utilities
│   │   │   ├── api/           # API client
│   │   │   └── config.ts      # Configuration
│   │   ├── types/             # TypeScript definitions
│   │   └── utils/             # Helper functions
│   ├── .env.local             # Environment variables
│   └── package.json           # Dependencies
├── [backend files]            # Express.js backend (unchanged)
├── docs/                      # Documentation
└── plans/                     # Project planning docs
```

## 🔧 Key Files & Configurations

### Environment Variables
```bash
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3003
NEXT_PUBLIC_APP_DOMAIN=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://miojaflixmncmhsgyabd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[key]
NODE_ENV=development
```

### API Configuration
```typescript
// src/lib/config.ts
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    LESSONS: '/api/lessons',
    // ... all endpoints
  }
}
```

### API Client Usage
```typescript
// src/lib/api/client.ts
import { apiClient } from '@/lib/api/client';

// GET request
const response = await apiClient.get<Lesson[]>('/api/lessons');

// POST request
const loginResponse = await apiClient.post<AuthResponse>('/api/auth/login', {
  username: 'user',
  password: 'pass'
});

// Handle response
if (response.success) {
  console.log(response.data);
} else {
  console.error(response.error);
}
```

## 📦 Dependencies Overview

### Core Framework
- **Next.js 15.4.2**: React framework with App Router
- **React 19**: Latest React with concurrent features
- **TypeScript 5**: Type safety and developer experience

### State Management
- **@tanstack/react-query**: Server state management
- **zustand**: Client state management
- **react-hook-form**: Form state management

### UI & Styling
- **Tailwind CSS 4**: Utility-first CSS framework
- **lucide-react**: Modern icon library
- **clsx**: Conditional class names
- **class-variance-authority**: Component variants

### Utilities
- **zod**: Runtime type validation
- **katex**: Math formula rendering
- **date-fns**: Date manipulation
- **js-cookie**: Cookie management

## 🛠️ Development Commands

### Frontend Commands
```bash
cd frontend

# Development
npm run dev          # Start dev server with hot reload
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Type checking
npx tsc --noEmit     # Check TypeScript without building
```

### Backend Commands
```bash
# From root directory
npm start            # Start Express.js server
npm test             # Run tests (if available)
```

## 🎯 Common Patterns

### Creating a New Page
```typescript
// src/app/example/page.tsx
export default function ExamplePage() {
  return (
    <div>
      <h1>Example Page</h1>
    </div>
  );
}
```

### Creating a Component
```typescript
// src/components/ui/Button.tsx
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded ${
        variant === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
```

### Using API Client
```typescript
// src/hooks/useLessons.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Lesson } from '@/types/api';

export function useLessons() {
  return useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      const response = await apiClient.get<Lesson[]>('/api/lessons');
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    }
  });
}
```

### Form Handling
```typescript
// Using react-hook-form + zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, 'Username required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = (data: LoginForm) => {
    // Handle form submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('username')} placeholder="Username" />
      {errors.username && <span>{errors.username.message}</span>}
      
      <input {...register('password')} type="password" placeholder="Password" />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Login</button>
    </form>
  );
}
```

## 🔍 Debugging & Troubleshooting

### Common Issues
1. **Build Errors**: Check TypeScript errors with `npx tsc --noEmit`
2. **API Connection**: Verify backend is running on port 3003
3. **Environment Variables**: Ensure `.env.local` exists and has correct values
4. **Import Errors**: Use `@/` alias for src imports

### Development Tools
- **React DevTools**: Browser extension for React debugging
- **TanStack Query DevTools**: Built-in query debugging
- **Next.js DevTools**: Built-in performance monitoring

### Useful Commands
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check bundle size
npm run build
npx @next/bundle-analyzer
```

## 📚 Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Project-Specific Docs
- `docs/phase1-completion-summary.md` - Phase 1 overview
- `plans/PHASE1_PROCESS_DOCUMENTATION.md` - Detailed process
- `plans/PHASE1_TECHNICAL_REVIEW.md` - Technical decisions

## ✅ Phase 1 Status

**Completed Tasks:**
- [x] Next.js project setup
- [x] Project structure organization
- [x] Environment configuration
- [x] API client implementation
- [x] Dependencies installation
- [x] TypeScript configuration
- [x] Build optimization

**Ready for Phase 2:**
- Authentication system implementation
- Core infrastructure setup
- UI component library
- State management integration
