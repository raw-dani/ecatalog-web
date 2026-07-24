<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $products = $query->orderBy('created_at', 'desc')->paginate(20);

        return ProductResource::collection($products);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:products,slug',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'sku' => 'nullable|string|max:100|unique:products,sku',
            'stock' => 'required|integer|min:0',
            'min_order' => 'integer|min:1',
            'unit' => 'string|max:50',
            'images' => 'nullable|array',
            'specifications' => 'nullable|array',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
        ]);

        $validated['min_order'] = $validated['min_order'] ?? 1;
        $validated['unit'] = $validated['unit'] ?? 'pcs';

        $product = Product::create($validated);

        return new ProductResource($product);
    }

    public function show(Product $product)
    {
        return new ProductResource($product);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:products,slug,' . $product->id,
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'sku' => 'nullable|string|max:100|unique:products,sku,' . $product->id,
            'stock' => 'required|integer|min:0',
            'min_order' => 'integer|min:1',
            'unit' => 'string|max:50',
            'images' => 'nullable|array',
            'specifications' => 'nullable|array',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
        ]);

        $validated['min_order'] = $validated['min_order'] ?? 1;
        $validated['unit'] = $validated['unit'] ?? 'pcs';

        $product->update($validated);

        return new ProductResource($product);
    }

    public function destroy(Product $product)
    {
        // Delete associated images
        if ($product->images) {
            foreach ($product->images as $image) {
                Storage::disk('public')->delete($image);
            }
        }

        $product->delete();

        return response()->json(null, 204);
    }

    public function uploadImages(Request $request, Product $product)
    {
        $request->validate([
            'images' => 'required|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        $uploaded = [];
        foreach ($request->file('images') as $file) {
            $path = $file->store('products', 'public');
            $uploaded[] = $path;
        }

        $existingImages = $product->images ?? [];
        $product->update([
            'images' => array_merge($existingImages, $uploaded),
        ]);

        return response()->json([
            'message' => 'Gambar berhasil diupload',
            'images' => collect($uploaded)->map(fn($p) => asset('storage/' . $p)),
        ]);
    }

    public function deleteImage(Request $request, Product $product)
    {
        $request->validate([
            'image' => 'required|string',
        ]);

        $image = $request->image;
        $images = $product->images ?? [];

        $images = array_filter($images, fn($i) => $i !== $image);
        $product->update(['images' => array_values($images)]);

        Storage::disk('public')->delete($image);

        return response()->json(['message' => 'Gambar berhasil dihapus']);
    }
}