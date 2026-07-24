import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatCurrency';

export default function CartItem({ item, onUpdate, onRemove }) {
  const finalPrice = item.product?.discount_price ?? item.product?.price ?? 0;
  const subtotal = finalPrice * item.quantity;

  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
      <div className="w-20 h-20 bg-gray-200 rounded overflow-hidden flex-shrink-0">
        {item.product?.images?.[0] && (
          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-gray-900 truncate">{item.product?.name}</h4>
        <p className="text-sm text-gray-500">{formatCurrency(finalPrice)}</p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onUpdate(item.id, Math.max(1, item.quantity - 1))} className="w-8 h-8 border rounded hover:bg-gray-100">-</button>
        <span className="w-8 text-center">{item.quantity}</span>
        <button onClick={() => onUpdate(item.id, item.quantity + 1)} className="w-8 h-8 border rounded hover:bg-gray-100">+</button>
      </div>
      <div className="text-right w-24">
        <p className="font-semibold">{formatCurrency(subtotal)}</p>
      </div>
      <button onClick={() => onRemove(item.id)} className="text-danger-500 hover:text-danger-700">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
