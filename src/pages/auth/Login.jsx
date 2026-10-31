import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, User, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

export const Login = () => {
  const [email, setEmail] = useState('priyanka@brightloop.io');
  const [password, setPassword] = useState('Secret123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (res?.success) {
        if (res.role === 'STAFF') {
          navigate('/staff/dashboard');
        } else if (res.role === 'CUSTOMER') {
          navigate('/portal/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      } else if (res?.message) {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role) => {
    if (role === 'admin') {
      setEmail('priyanka@brightloop.io');
      setPassword('Admin@Brightloop123!');
    } else if (role === 'staff') {
      setEmail('rohan.d@brightloop.io');
      setPassword('Staff@Brightloop123!');
    } else {
      setEmail('aditi@zenithtech.in');
      setPassword('Client@Zenith123!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white shadow-md mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in to <span className="text-brand-600">Brightloop</span>
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enterprise Subscription & Recurring Revenue Engine
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-card rounded-2xl border border-slate-200/80">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 placeholder:text-slate-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 placeholder:text-slate-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
              icon={ArrowRight}
            >
              Sign In to Workspace
            </Button>
          </form>

          {/* Demo Quick-Login Presets */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
              Quick Demo Fill
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                title="Login as Super Admin"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span className="truncate">Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('staff')}
                className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                title="Login as Staff Member"
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">Staff</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('customer')}
                className="flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                title="Login as Client"
              >
                <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Customer</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Don't have an enterprise account?{' '}
          <Link to="/auth/register" className="font-semibold text-brand-600 hover:text-brand-700">
            Register new organization
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
