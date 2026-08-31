<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\CartItem;
use App\Models\Order;
use App\Services\OrderService;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService,
        protected WhatsAppService $whatsappService
    ) {}

    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:50',
            'customer_email' => 'nullable|email|max:255',
            'customer_whatsapp' => 'nullable|string|max:50',
            'shipping_address' => 'nullable|string',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.notes' => 'nullable|string',
            'session_id' => 'nullable|string',
        ]);

        $validated = $this->orderService->validateCartItems($request->items);

        if (!empty($validated['errors'])) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $validated['errors']
            ], 422);
        }

        $items = $validated['items'];
        $subtotal = array_sum(array_column($items, 'subtotal'));
        $total = $subtotal;

        $orderData = [
            'customer_name' => $request->customer_name,
            'customer_phone' => $request->customer_phone,
            'customer_email' => $request->customer_email,
            'customer_whatsapp' => $request->customer_whatsapp,
            'shipping_address' => $request->shipping_address,
            'notes' => $request->notes,
            'subtotal' => $subtotal,
            'discount' => 0,
            'shipping_cost' => 0,
            'total' => $total,
            'payment_method' => null,
            'items' => $items,
            'session_id' => $request->session_id,
        ];

        $order = $this->orderService->createOrder($orderData);

        $message = $this->whatsappService->generateOrderMessage(
            $items,
            $total,
            $request->only('customer_name', 'customer_phone', 'customer_email', 'shipping_address', 'notes')
        );

        return response()->json([
            'order' => new OrderResource($order),
            'whatsapp_url' => $this->whatsappService->generateWaLink($message),
        ], 201);
    }

    public function show($orderNumber)
    {
        $order = Order::with('items')->where('order_number', $orderNumber)->firstOrFail();
        return new OrderResource($order);
    }
}
