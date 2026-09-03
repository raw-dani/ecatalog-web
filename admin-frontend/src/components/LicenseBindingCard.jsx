import { useEffect, useState } from 'react';
import { getLicenseBinding, bindLicense } from '../../services/adminService';
import { useToast } from '../Toast';

function CopyButton({ value, label = 'Salin' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = value || '';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-2 px-2 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
    >
      {copied ? 'Tersalin ✓' : label}
    </button>
  );
}

function shortHash(value, head = 8, tail = 8) {
  if (!value) return '-';
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export default function LicenseBindingCard() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [binding, setBinding] = useState(null);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [transferToken, setTransferToken] = useState('');
  const [bindingBusy, setBindingBusy] = useState(false);
  const [confirmUnbind, setConfirmUnbind] = useState(false);

  const fetchBinding = async () => {
    setLoading(true);
    try {
      const data = await getLicenseBinding();
      setBinding(data);
    } catch (err) {
      addToast('Gagal memuat info license binding', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBinding();
  }, []);

  const handleBind = async () => {
    if (!transferToken.trim()) {
      addToast('Transfer token wajib diisi', 'error');
      return;
    }

    setBindingBusy(true);
    try {
      const result = await bindLicense({ transfer_token: transferToken.trim() });
      if ((result?.status || '') === 'success') {
        addToast(result.message || 'License berhasil di-bind ke server ini', 'success');
        setTransferToken('');
        setShowTokenInput(false);
        await fetchBinding();
        try {
          localStorage.setItem(
            'ecatalog_admin_license_status',
            JSON.stringify({ status: 'valid', message: '', expiresAt: Date.now() + 60000 })
          );
        } catch {}
      } else {
        addToast(result?.message || 'Gagal melakukan binding', 'error');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Gagal melakukan binding';
      addToast('Gagal binding: ' + message, 'error');
    } finally {
      setBindingBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow mb-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
        </div>
      </div>
    );
  }

  const installInfo = binding?.install_info || {};
  const installation = binding?.installation || null;
  const isBound = !!binding?.is_bound;
  const enforceBinding = !!binding?.enforce_binding;

  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            License Binding (Server Lock)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Lisensi terikat ke server ini. Jika aplikasi dipindahkan ke server lain, server baru tidak akan bisa berjalan tanpa transfer token dari admin.
          </p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            isBound ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full mr-2 ${
              isBound ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          {isBound ? 'Bound' : 'Not Bound'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Install ID</div>
          <div className="flex items-center">
            <code className="font-mono text-sm text-slate-800 break-all">{installInfo.install_id || '-'}</code>
            <CopyButton value={installInfo.install_id} />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            ID unik server ini. Kirimkan ke admin jika perlu pindah server.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Machine Fingerprint</div>
          <div className="flex items-center">
            <code className="font-mono text-sm text-slate-800 break-all" title={installInfo.machine_fingerprint}>
              {shortHash(installInfo.machine_fingerprint)}
            </code>
            <CopyButton value={installInfo.machine_fingerprint} />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            SHA-256 dari MAC + hostname + OS server.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Hostname</div>
          <div className="font-mono text-sm text-slate-800">{installInfo.hostname || '-'}</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">MAC Address</div>
          <div className="font-mono text-sm text-slate-800">{installInfo.mac_address || 'tidak terbaca'}</div>
        </div>

        {installation && (
          <>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Bound At</div>
              <div className="text-sm text-slate-800">
                {installation.bound_at ? new Date(installation.bound_at).toLocaleString('id-ID') : '-'}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Last Seen</div>
              <div className="text-sm text-slate-800">
                {installation.last_seen_at ? new Date(installation.last_seen_at).toLocaleString('id-ID') : '-'}
              </div>
            </div>
          </>
        )}
      </div>

      {!enforceBinding && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm p-3 rounded-xl">
          ⚠️ Binding enforcement sedang dinonaktifkan (LICENSE_ENFORCE_BINDING=false). License tidak terkunci ke server.
        </div>
      )}

      {!isBound && enforceBinding && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 text-sm p-4 rounded-xl">
          <strong className="block mb-1">⚠️ License belum terikat ke server ini</strong>
          <p>
            Aplikasi ini sebelumnya terikat di server lain, atau ini adalah server baru. Untuk mengaktifkan license, minta <strong>transfer token</strong> ke admin License Manager, lalu masukkan di bawah ini.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={fetchBinding}
          className="border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm hover:bg-slate-50"
        >
          Refresh
        </button>
        {!showTokenInput ? (
          <button
            type="button"
            onClick={() => setShowTokenInput(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-primary-700"
          >
            {isBound ? 'Pindah / Re-bind Server' : 'Bind dengan Transfer Token'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowTokenInput(false);
              setTransferToken('');
            }}
            className="border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm hover:bg-slate-50"
          >
            Batal
          </button>
        )}
      </div>

      {showTokenInput && (
        <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Transfer Token (dari admin License Manager)
          </label>
          <textarea
            value={transferToken}
            onChange={(e) => setTransferToken(e.target.value)}
            placeholder="Paste token di sini..."
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-xs text-slate-500 mt-2 mb-3">
            Token ini hanya berlaku sekali pakai dan memiliki masa aktif (default 24 jam). Setelah bind berhasil, server lama otomatis terblokir.
          </p>
          <button
            type="button"
            onClick={handleBind}
            disabled={bindingBusy || !transferToken.trim()}
            className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-primary-700 disabled:bg-slate-300"
          >
            {bindingBusy ? 'Memproses...' : 'Konfirmasi & Bind'}
          </button>
        </div>
      )}
    </div>
  );
}