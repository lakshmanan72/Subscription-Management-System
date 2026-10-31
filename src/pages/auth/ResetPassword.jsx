import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Lock, ArrowRight, Check, X, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';

export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const hasMinLength = password.length > 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasSpecialChar;
  const isConfirmMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Please fulfill all password requirements.');
      return;
    }
    if (!isConfirmMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Your password has been successfully reset! Please sign in.');
      navigate('/auth/login');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white shadow-md mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Set New Password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Choose a secure new password for your Brightloop account
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
                New Password
              </label>
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
                  className="block w-full pl-9 pr-10 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                    {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>More than 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                    {hasUpperCase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>At least one uppercase letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLowerCase ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                    {hasLowerCase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>At least one lowercase letter (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
                    {hasSpecialChar ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>At least one special character</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 transition-colors"
                />
              </div>
              {confirmPassword && (
                <p className={`mt-1 text-[11px] ${isConfirmMatch ? 'text-emerald-600 font-medium' : 'text-rose-600'}`}>
                  {isConfirmMatch ? '✓ Passwords match' : '✕ Passwords do not match'}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-4"
              isLoading={isLoading}
              icon={ArrowRight}
            >
              Update Password
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link
              to="/auth/login"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

