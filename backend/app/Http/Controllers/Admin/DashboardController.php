<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        $statuses = ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'];
        $orderCounts = [];
        foreach ($statuses as $status) {
            $orderCounts[$status . '_orders'] = Order::where('status', $status)->count();
        }

        // Today's stats
        $today = now()->startOfDay();
        $yesterday = now()->subDay()->startOfDay();

        $todayOrders = Order::where('created_at', '>=', $today)->count();
        $yesterdayOrders = Order::whereBetween('created_at', [$yesterday, $today])->count();
        $todayRevenue = Order::where('created_at', '>=', $today)->where('status', '!=', 'cancelled')->sum('total');
        $yesterdayRevenue = Order::whereBetween('created_at', [$yesterday, $today])->where('status', '!=', 'cancelled')->sum('total');

        // Top selling products
        $topSelling = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->select('products.id', 'products.name', 'products.price', 'products.images', DB::raw('SUM(order_items.quantity) as total_qty'), DB::raw('SUM(order_items.subtotal) as total_revenue'))
            ->groupBy('products.id', 'products.name', 'products.price', 'products.images')
            ->orderBy('total_qty', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                $images = $item->images ? json_decode($item->images, true) : [];
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'price' => $item->price,
                    'image' => !empty($images) ? (str_starts_with($images[0], 'http') ? $images[0] : asset('storage/' . $images[0])) : null,
                    'total_qty' => (int) $item->total_qty,
                    'total_revenue' => (float) $item->total_revenue,
                ];
            });

        return response()->json([
            'total_products' => Product::count(),
            'active_products' => Product::where('is_active', true)->count(),
            'total_categories' => Category::count(),
            'total_orders' => Order::count(),
            'pending_orders' => Order::where('status', 'pending')->count(),
            'total_revenue' => Order::where('status', '!=', 'cancelled')->sum('total'),
            'order_counts' => $orderCounts,
            'total_bank_accounts' => BankAccount::count(),
            'today_orders' => $todayOrders,
            'today_revenue' => $todayRevenue,
            'yesterday_orders' => $yesterdayOrders,
            'yesterday_revenue' => $yesterdayRevenue,
            'top_selling_products' => $topSelling,
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