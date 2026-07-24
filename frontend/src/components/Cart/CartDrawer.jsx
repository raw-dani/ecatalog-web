import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';

export default function CartDrawer({ isOpen, onClose }) {
  const { items, updateQuantity, removeItem } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">Keranjang Belanja</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Keranjang kosong</p>
            ) : (
              items.map(item => (
                <CartItem key={item.id} item={item} onUpdate={updateQuantity} onRemove={removeItem} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
