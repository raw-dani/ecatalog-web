export default function LicenseLocked({ message, onActivate }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 text-center border border-gray-200">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Panel Admin Dikunci</h2>
        <p className="text-sm text-gray-600 mb-6">
          {message || 'Lisensi tidak valid atau telah di-suspend. Aktifkan kembali license untuk melanjutkan.'}
        </p>
        {onActivate && (
          <button
            onClick={onActivate}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Aktivasi License
          </button>
        )}
        <div className="mt-4 bg-gray-50 rounded-lg p-4 text-xs text-gray-500 border border-gray-100">
          <p>Hubungi administrator jika membutuhkan bantuan untuk aktivasi ulang license.</p>
        </div>
      </div>
    </div>
  );
}
