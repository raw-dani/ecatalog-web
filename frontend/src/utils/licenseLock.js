let listeners = [];
let locked = false;
let message = '';

export const setLicenseLocked = (msg) => {
  message = msg || 'Lisensi tidak valid atau telah di-suspend. Hubungi administrator untuk mengaktifkan kembali.';
  locked = true;
  listeners.forEach((fn) => fn(message));
};

export const clearLicenseLock = () => {
  locked = false;
  message = '';
  listeners.forEach((fn) => fn(''));
};

export const getLicenseLocked = () => locked;

export const onLicenseLocked = (fn) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
};
