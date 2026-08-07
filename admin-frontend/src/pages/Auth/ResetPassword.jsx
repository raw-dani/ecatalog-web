import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../services/adminService';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 1) return { label: 'Lemah', color: 'bg-danger-500', textColor: 'text-danger-600', width: '25%' };
  if (score <= 2) return { label: 'Cukup', color: 'bg-warning-500', textColor: 'text-warning-600', width: '50%' };
  if (score <= 3) return { label: 'Sedang', color: 'bg-primary-500', textColor: 'text-primary-600', width: '75%' };
  return { label: 'Kuat', color: 'bg-success-500', textColor: 'text-success-600', width: '100%' };
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const passwordRef = useRef(null);

  const strength = getPasswordStrength(password);

  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password minimal 8 karakter' });
      setLoading(false);
      return;
    }

    if (password !== passwordConfirmation) {
      setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' });
      setLoading(false);
      return;
    }

    if (strength.label === 'Lemah') {
      setMessage({ type: 'error', text: 'Password terlalu lemah. Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol.' });
      setLoading(false);
      return;
    }

    try {
      const data = await resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      setMessage({ type: 'success', text: data.message || 'Password berhasil direset!' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Gagal mereset password';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Link Tidak Valid</h1>
          <p className="text-slate-500 mb-4">Link reset password tidak valid atau sudah kadaluarsa.</p>
          <Link to="/forgot-password" className="text-primary-600 hover:underline">
            Minta link baru
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center">Reset Password</h1>
        <p className="text-slate-500 text-sm text-center mb-6">
          Buat password baru untuk akun {email}
        </p>

        {message.text && (
          <div className={`p-3 rounded mb-4 ${
              message.type === 'success' ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Password Baru</label>
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 pr-10"
                placeholder="Minimal 8 karakter"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                </div>
                <p className={`text-xs mt-1 ${strength.textColor}`}>
                  Kekuatan password: {strength.label}
                </p>
                <ul className="text-xs text-slate-400 mt-1 space-y-1">
                  <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-success-600' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Minimal 8 karakter
                  </li>
                  <li className={`flex items-center gap-2 ${/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-success-600' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Huruf besar & kecil
                  </li>
                  <li className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-success-600' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Angka
                  </li>
                  <li className={`flex items-center gap-2 ${/[^a-zA-Z0-9]/.test(password) ? 'text-success-600' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    Simbol (!@#$%^&*)
                  </li>
                </ul>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className={`w-full border border-slate-300 rounded-xl px-3 py-2 ${
                passwordConfirmation && password !== passwordConfirmation ? 'border-danger-500' : ''
              }`}
              placeholder="Masukkan ulang password"
              required
              autoComplete="new-password"
            />
            {passwordConfirmation && password !== passwordConfirmation && (
              <p className="text-danger-500 text-xs mt-1">Password tidak cocok</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:bg-slate-300 transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Menyimpan...
              </span>
            ) : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-primary-600 hover:underline text-sm">
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
