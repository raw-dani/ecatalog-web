export const formatCurrency = (value) => {
  if (!value && value !== 0) return 'Rp 0';
  return 'Rp ' + Number(value).toLocaleString('id-ID');
};
