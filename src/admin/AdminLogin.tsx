import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (token: string, admin: any) => void;
  onBackToPublicForm: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToPublicForm }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both your administrator email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Authentication failed. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      onLoginSuccess(data.token, data.admin);
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to the authentication service. Please verify your network.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] text-[#111111] font-sans antialiased flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar with Back Button */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pb-6">
        <button
          type="button"
          onClick={onBackToPublicForm}
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#737373] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Public Form</span>
        </button>
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#6B1D2F] font-semibold bg-[#6B1D2F]/5 px-2 py-0.5 border border-[#6B1D2F]/20 rounded-[2px]">
          Confidential
        </span>
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full mx-auto bg-[#FFFFFF] border border-[#E5E5E5] p-6 sm:p-10 shadow-sm rounded-[2px]">
        {/* WME Brand Lockup */}
        <div className="text-center pb-6 mb-6 border-b border-[#E5E5E5]">
          <span className="wme-wordmark text-3xl text-[#111111] block mb-1">
            WME
          </span>
          <span className="text-xs font-mono tracking-wider uppercase text-[#737373] block">
            William Morris Endeavor
          </span>
          <h1 className="text-xl font-serif text-[#111111] mt-4">
            Staff Portal Login
          </h1>
          <p className="text-xs text-[#666666] mt-1.5 leading-relaxed font-sans">
            Administrative intake management for Keanu Reeves meet &amp; greet inquiries.
          </p>
        </div>

        {error && (
          <div
            className="mb-6 p-3.5 bg-[#FEF2F2] border border-[#F87171] text-[#991B1B] text-xs flex items-start gap-2.5 rounded-[2px]"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-mono uppercase tracking-wider text-[#111111] mb-1.5"
            >
              Administrator Email <span className="text-[#888888]">*</span>
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="username"
              placeholder="admin@wmeagency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="wme-input text-sm"
              disabled={isLoading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="admin-password"
                className="block text-xs font-mono uppercase tracking-wider text-[#111111]"
              >
                Password <span className="text-[#888888]">*</span>
              </label>
            </div>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="wme-input text-sm pr-11"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 bottom-0 px-3 flex items-center text-[#737373] hover:text-[#111111] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full text-xs font-semibold py-3.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-[#E5E5E5] text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#737373] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-[#6B1D2F]" />
            <span>Authorized Administrator Access Only</span>
          </div>
          <p className="text-[10px] text-[#888888] mt-1 font-sans">
            Initial setup credentials: <span className="font-mono text-[#111111]">admin@wmeagency.com</span>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] font-mono text-[#888888] py-4">
        &copy; {new Date().getFullYear()} WME (William Morris Endeavor). Confidential System.
      </footer>
    </div>
  );
};
