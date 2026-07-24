import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../services/adminService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = await forgotPassword(email);
      setMessage({
        type: 'success',
        text: data.message || 'Link reset password telah dikirim ke email Anda.',
      });
      // In development, show the token
      if (data.token) {
        setMessage({
          type: 'success',
          text: `Link reset password telah dikirim. Token: ${data.token}`,
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Gagal mengirim email reset password';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center">Lupa Password</h1>
        <p className="text-gray-500 text-sm text-center mb-6">
          Masukkan email admin Anda untuk menerima link reset password
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
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="admin@example.com"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-300"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Mengirim...
              </span>
            ) : 'Kirim Link Reset'}
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