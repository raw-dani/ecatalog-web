import useOnlineStatus from '../../hooks/useOnlineStatus';

/**
 * Banner yang tampil saat pengguna kehilangan koneksi internet.
 * Aplikasi tetap berjalan memakai data dari cache service worker.
 */
export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white text-sm text-center py-2 px-4 shadow-md"
      role="status"
      aria-live="polite"
    >
      Mode offline — menampilkan data tersimpan. Beberapa fitur mungkin tidak tersedia.
    </div>
  );
}