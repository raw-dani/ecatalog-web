<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProductResource;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query()->withCount('products');

        if ($request->filled('parent_id')) {
            $query->where('parent_id', $request->parent_id);
        } else {
            $query->whereNull('parent_id');
        }

        if ($request->filled('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $categories = $query->orderBy('sort_order')->orderBy('name')->get();

        return CategoryResource::collection($categories);
    }

    public function show($slug)
    {
        $category = Category::where('slug', $slug)->firstOrFail();
        return new CategoryResource($category);
    }

    public function products($slug, Request $request)
    {
        $category = Category::where('slug', $slug)->firstOrFail();

        $query = $category->products()->where('is_active', true);

        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
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
}
