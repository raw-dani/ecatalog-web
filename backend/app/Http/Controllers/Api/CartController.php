<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CartResource;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $sessionId = $request->header('X-Session-ID') ?? $request->query('session_id');

        if (!$sessionId) {
            return response()->json(['data' => []]);
        }

        $items = CartItem::with('product')
            ->where('session_id', $sessionId)
            ->get();

        return CartResource::collection($items);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
            'session_id' => 'required|string',
        ]);

        $product = Product::findOrFail($request->product_id);

        if (!$product->is_active) {
            return response()->json(['message' => 'Produk tidak aktif'], 400);
        }

        if ($product->stock < $request->quantity) {
            return response()->json(['message' => 'Stok tidak mencukupi'], 400);
        }

        $cartItem = CartItem::updateOrCreate(
            ['session_id' => $request->session_id, 'product_id' => $request->product_id],
            ['quantity' => $request->quantity, 'notes' => $request->notes]
        );

        return new CartResource($cartItem->load('product'));
    }

    public function update(Request $request, CartItem $cartItem)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $cartItem->update(['quantity' => $request->quantity]);

        return new CartResource($cartItem->load('product'));
    }

    public function destroy(CartItem $cartItem)
    {
        $cartItem->delete();

        return response()->json(null, 204);
    }

    public function clear(Request $request)
    {
        $sessionId = $request->header('X-Session-ID') ?? $request->query('session_id');

        if ($sessionId) {
            CartItem::where('session_id', $sessionId)->delete();
        }

        return response()->json(null, 204);
    }
}
