<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Admin;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats()
    {
        $statuses = ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'];
        $orderCounts = [];
        foreach ($statuses as $status) {
            $orderCounts[$status . '_orders'] = Order::where('status', $status)->count();
        }

        return response()->json([
            'total_products' => Product::count(),
            'active_products' => Product::where('is_active', true)->count(),
            'total_categories' => Category::count(),
            'total_orders' => Order::count(),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'total_revenue' => Order::where('status', '!=', 'cancelled')->sum('total'),
            'order_counts' => $orderCounts,
            'total_bank_accounts' => BankAccount::count(),
            'recent_orders' => Order::with('items')->orderBy('created_at', 'desc')->limit(5)->get()->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_name' => $order->customer_name,
                    'total' => $order->total,
                    'status' => $order->status,
                    'created_at' => $order->created_at,
                ];
            }),
            'low_stock_products' => Product::where('stock', '<', 5)->where('is_active', true)->orderBy('stock')->limit(10)->get()->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'stock' => $product->stock,
                    'price' => $product->price,
                ];
            }),
        ]);
    }
}
