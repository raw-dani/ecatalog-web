export default function LicenseLocked({ message }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 text-center border border-gray-200">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Aplikasi Dikunci</h2>
        <p className="text-sm text-gray-600 mb-6">
          {message || 'Lisensi tidak valid atau telah di-suspend. Hubungi administrator untuk mengaktifkan kembali.'}
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500 border border-gray-100">
          <p>Jika Anda adalah administrator, silakan login ke panel admin untuk melakukan aktivasi ulang license.</p>
        </div>
      </div>
    </div>
  );
}
