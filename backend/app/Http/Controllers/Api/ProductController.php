<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query()->where('is_active', true);

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('featured')) {
            $query->where('is_featured', true);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('sort')) {
            switch ($request->sort) {
                case 'price_asc':
                    $query->orderBy('price', 'asc');
                    break;
                case 'price_desc':
                    $query->orderBy('price', 'desc');
                    break;
                case 'name':
                    $query->orderBy('name', 'asc');
                    break;
                case 'newest':
                    $query->orderBy('created_at', 'desc');
                    break;
                default:
                    $query->orderBy('sort_order');
            }
        } else {
            $query->orderBy('sort_order');
        }

        $products = $query->paginate(20);

        return ProductResource::collection($products);
    }

    public function featured()
    {
        $products = Product::where('is_featured', true)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->limit(8)
            ->get();

        return ProductResource::collection($products);
    }

    public function show($slug)
    {
        $product = Product::where('slug', $slug)->where('is_active', true)->firstOrFail();
        return new ProductResource($product);
    }

    public function related($slug)
    {
        $product = Product::where('slug', $slug)->where('is_active', true)->firstOrFail();

        // Produk dari kategori yang sama, exclude produk saat ini
        $related = Product::where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->limit(8)
            ->get();

        // Fallback: jika kurang dari 4, tambahkan produk lain (terbaru) sebagai pelengkap
        if ($related->count() < 4) {
            $existingIds = $related->pluck('id')->push($product->id);
            $fallback = Product::where('is_active', true)
                ->whereNotIn('id', $existingIds)
                ->orderBy('created_at', 'desc')
                ->limit(4 - $related->count())
                ->get();
            $related = $related->concat($fallback);
        }

        return ProductResource::collection($related);
    }
}
