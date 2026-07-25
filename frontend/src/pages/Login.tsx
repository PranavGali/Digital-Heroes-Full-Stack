import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserProfile } from '../context/AuthContext';
import apiClient from '../api/client';
import { Shield, Lock, Mail, AlertCircle, User, ShieldCheck } from 'lucide-react';

interface LoginRegisterInput {
  name?: string;
  email: string;
  password: string;
  role?: 'admin' | 'member';
}

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegister, setIsRegister] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginRegisterInput>({
    defaultValues: {
      role: 'member',
    }
  });

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const onSubmit = async (data: LoginRegisterInput) => {
    setSubmitting(true);
    setApiError(null);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister 
        ? { name: data.name, email: data.email, password: data.password, role: data.role }
        : { email: data.email, password: data.password };

      const response = await apiClient.post(endpoint, payload);
      if (response.data.success) {
        const { token, user } = response.data;
        login(token, user as UserProfile);
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Authentication failed. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setApiError(null);
    reset();
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-accentIndigo/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accentBlue/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="glass-panel rounded-2xl border border-darkBorder/60 shadow-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-accentIndigo/10 rounded-xl flex items-center justify-center border border-accentIndigo/20 mb-4">
              <Shield className="w-6 h-6 text-accentIndigo" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {isRegister ? 'Create Account' : 'Agent Portal'}
            </h2>
            <p className="mt-2 text-sm text-slate-400 text-center">
              {isRegister 
                ? 'Register a new profile to access the CRM platform' 
                : 'Enter your credentials to access the Lead Management System'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-lg flex items-start gap-2 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    placeholder="John Miller"
                    className={`block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accentIndigo transition-all ${
                      errors.name ? 'border-red-500/50 focus:ring-red-500' : 'border-darkBorder hover:border-slate-650'
                    }`}
                    {...register('name', { required: isRegister ? 'Name is required' : false })}
                  />
                </div>
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@crm.com"
                  className={`block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accentIndigo transition-all ${
                    errors.email ? 'border-red-500/50 focus:ring-red-500' : 'border-darkBorder hover:border-slate-650'
                  }`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: 'Enter a valid email address',
                    },
                  })}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-3 py-2.5 bg-slate-900/50 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accentIndigo transition-all ${
                    errors.password ? 'border-red-500/50 focus:ring-red-500' : 'border-darkBorder hover:border-slate-650'
                  }`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {isRegister && (
              <div>
                <label htmlFor="role" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Account Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <select
                    id="role"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-900 border border-darkBorder hover:border-slate-650 rounded-lg text-sm text-slate-350 focus:outline-none focus:ring-1 focus:ring-accentIndigo cursor-pointer"
                    {...register('role')}
                  >
                    <option value="member">Member (Sales Agent)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-accentIndigo to-indigo-650 hover:opacity-95 focus:outline-none hover:shadow-lg hover:shadow-accentIndigo/10 disabled:opacity-50 transition-all cursor-pointer mt-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 rounded-full border-white border-t-transparent animate-spin"></div>
                  {isRegister ? 'Creating Account...' : 'Logging in...'}
                </>
              ) : (
                isRegister ? 'Sign Up' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-darkBorder/40 text-center">
            <button
              onClick={toggleMode}
              className="text-xs font-medium text-accentIndigo hover:underline focus:outline-none cursor-pointer"
            >
              {isRegister 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Register Here"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
