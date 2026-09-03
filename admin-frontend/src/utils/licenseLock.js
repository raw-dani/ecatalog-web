let listeners = [];
let locked = false;
let message = '';
let bindingRequired = false;

export const setLicenseLocked = (msg, meta = {}) => {
  message = msg || 'Lisensi tidak valid atau telah di-suspend. Hubungi administrator untuk mengaktifkan kembali.';
  bindingRequired = !!meta.binding_required;
  locked = true;
  listeners.forEach((fn) => fn(message, { binding_required: bindingRequired }));
};

export const clearLicenseLock = () => {
  locked = false;
  message = '';
  bindingRequired = false;
  listeners.forEach((fn) => fn('', { binding_required: false }));
};

export const getLicenseLocked = () => locked;
export const isLicenseBindingRequired = () => bindingRequired;

export const onLicenseLocked = (fn) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
};