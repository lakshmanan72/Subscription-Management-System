import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, Building, ArrowRight, Check, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password validation rules:
  // - > 8 chars
  // - at least one uppercase letter
  // - at least one lowercase letter
  // - at least one special character
  const pwd = formData.password;
  const hasMinLength = pwd.length > 8;
  const hasUpperCase = /[A-Z]/.test(pwd);
  const hasLowerCase = /[a-z]/.test(pwd);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasSpecialChar;
  const isConfirmMatch = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;

  // Strict email format check
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid business email address.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password does not satisfy all security requirements.');
      return;
    }
    if (!isConfirmMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register(formData);
      if (res?.success) {
        navigate('/portal/dashboard');
      } else {
        setError(res?.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white shadow-md mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create Brightloop Account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Start your enterprise subscription management sandbox
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
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
                Full Name
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Radhika Sundaram"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Company Name
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g. Orbit Cloud Technologies"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 transition-colors"
                />
              </div>
            </div>

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
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="radhika@orbitcloud.com"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
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

              {/* Real-time Password Checklist */}
              {formData.password && (
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
                    <span>At least one special character (!@#$%^&*)</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative rounded-lg shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 transition-colors"
                />
              </div>
              {formData.confirmPassword && (
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
              Complete Registration
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

