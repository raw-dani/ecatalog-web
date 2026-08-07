import { useState } from 'react';
import { changeAdminPassword } from '../../services/adminService';
import { useToast } from '../../components/Toast';

export default function ChangePassword() {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await changeAdminPassword({
        current_password: formData.current_password,
        new_password: formData.new_password,
        new_password_confirmation: formData.new_password_confirmation,
      });
      addToast('Password berhasil diubah', 'success');
      setFormData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        const messages = Object.values(errors).flat().join(' ');
        addToast(messages, 'error');
      } else {
        addToast(err.response?.data?.message || 'Gagal mengubah password', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({ name, label, show, toggleShow, value, onChange }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          required
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A7.47 7.47 0 0 1 12 19c-4 0-7.5-3-11-7-.58-.87-.9-1.85-.9-2.92 0-1.07.32-2.05.9-2.92 3.5-4 7.5-4 11-4 1.5 0 3 .5 4.29 1.4" />
              <path d="M1 1l22 22" />
              <path d="M9 9a3 3 0 1 0 4.24 4.24" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Ganti Password</h1>
        <p className="text-sm text-slate-500 mt-1">Perbarui password akun Anda. Password minimal 8 karakter.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow border border-slate-100 p-6">
          <div className="space-y-4">
            <PasswordInput
              name="current_password"
              label="Password Saat Ini"
              show={showCurrent}
              toggleShow={() => setShowCurrent(!showCurrent)}
              value={formData.current_password}
              onChange={handleChange}
            />
            <PasswordInput
              name="new_password"
              label="Password Baru"
              show={showNew}
              toggleShow={() => setShowNew(!showNew)}
              value={formData.new_password}
              onChange={handleChange}
            />
            <PasswordInput
              name="new_password_confirmation"
              label="Konfirmasi Password Baru"
              show={showConfirm}
              toggleShow={() => setShowConfirm(!showConfirm)}
              value={formData.new_password_confirmation}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 text-sm font-medium transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Menyimpan...
              </>
            ) : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}

