import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatCurrency';

export default function CartSummary({ onCheckout }) {
  const { subtotal } = useCart();

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Ringkasan Belanja</h3>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Ongkir</span>
          <span>Gratis</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
      </div>
      <button
        onClick={onCheckout}
        disabled={subtotal === 0}
        className="w-full bg-success-600 text-white py-3 rounded-lg font-semibold hover:bg-success-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Checkout via WhatsApp
      </button>
    </div>
  );
}
