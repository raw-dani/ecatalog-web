<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function generateOrderNumber(): string
    {
        $date = now()->format('Ymd');
        $lastOrder = Order::where('order_number', 'like', "ORD-{$date}-%")
            ->orderByDesc('id')
            ->first();

        $sequence = $lastOrder ? (int) substr($lastOrder->order_number, -4) + 1 : 1;

        return 'ORD-' . $date . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    public function createOrder(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            $order = Order::create([
                'order_number' => $this->generateOrderNumber(),
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'customer_email' => $data['customer_email'] ?? null,
                'shipping_address' => $data['shipping_address'] ?? null,
                'notes' => $data['notes'] ?? null,
                'subtotal' => $data['subtotal'],
                'discount' => $data['discount'] ?? 0,
                'shipping_cost' => $data['shipping_cost'] ?? 0,
                'total' => $data['total'],
                'payment_method' => $data['payment_method'] ?? null,
                'status' => 'pending',
                'source' => 'whatsapp',
            ]);

            foreach ($data['items'] as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'product_name' => $item['product_name'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'subtotal' => $item['subtotal'],
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            if (!empty($data['session_id'])) {
                CartItem::where('session_id', $data['session_id'])->delete();
            }

            return $order->load('items');
        });
    }

    public function validateCartItems(array $items): array
    {
        $validated = [];
        $errors = [];

        foreach ($items as $item) {
            $product = Product::find($item['product_id']);

            if (!$product) {
                $errors[] = "Produk tidak ditemukan: {$item['product_id']}";
                continue;
            }

            if (!$product->is_active) {
                $errors[] = "Produk tidak aktif: {$product->name}";
                continue;
            }

            $quantity = max(1, (int) $item['quantity']);
            if ($quantity < $product->min_order) {
                $errors[] = "Minimal pemesanan untuk {$product->name} adalah {$product->min_order} {$product->unit}";
                continue;
            }

            if ($product->stock < $quantity) {
                $errors[] = "Stok tidak mencukupi untuk {$product->name}. Tersedia: {$product->stock}";
                continue;
            }

            $validated[] = [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'quantity' => $quantity,
                'unit_price' => $product->discount_price ?? $product->price,
                'subtotal' => ($product->discount_price ?? $product->price) * $quantity,
                'notes' => $item['notes'] ?? null,
            ];
        }

        return ['items' => $validated, 'errors' => $errors];
    }
}
