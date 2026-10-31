import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowLeft, Send, CheckCircle2, Info } from 'lucide-react';
import Button from '../../components/common/Button';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white shadow-md mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Reset Your Password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          We'll send you instructions to recover your Brightloop workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-card rounded-2xl border border-slate-200/80">
          {isSubmitted ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                Password Reset Link Generated
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                In this frontend demonstration environment, a simulated reset link has been prepared for <strong className="text-slate-800">{email}</strong>.
              </p>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 text-left mb-5 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Notice: Backend email delivery services will be wired once FastAPI endpoints are active. You can test the reset UI directly below.
                </span>
              </div>

              <Link to="/auth/reset-password">
                <Button variant="primary" size="md" className="w-full">
                  Proceed to Reset Password Page
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Account Email
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
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 transition-colors"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
                icon={Send}
              >
                Send Reset Instructions
              </Button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

