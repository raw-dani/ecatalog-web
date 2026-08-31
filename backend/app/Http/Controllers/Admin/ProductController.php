<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\Category;
use App\Models\StoreSubscriber;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\NewProductNotificationMail;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query()->with(['category', 'brand']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('brand_id')) {
            $query->where('brand_id', $request->brand_id);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('is_featured')) {
            $query->where('is_featured', $request->boolean('is_featured'));
        }

        if ($request->filled('stock_status')) {
            if ($request->stock_status === 'low') {
                $query->where('stock', '<', 5);
            } elseif ($request->stock_status === 'out') {
                $query->where('stock', '<=', 0);
            } elseif ($request->stock_status === 'available') {
                $query->where('stock', '>', 0);
            }
        }

        // Sorting
        $sortField = $request->sort_field ?? 'created_at';
        $sortDirection = $request->sort_direction ?? 'desc';
        $allowedSortFields = ['name', 'price', 'stock', 'is_active', 'is_featured', 'created_at', 'category_id', 'brand_id'];
        if (in_array($sortField, $allowedSortFields)) {
            if ($sortField === 'category_id') {
                $query->join('categories', 'products.category_id', '=', 'categories.id')
                      ->orderBy('categories.name', $sortDirection === 'asc' ? 'asc' : 'desc')
                      ->select('products.*');
            } elseif ($sortField === 'brand_id') {
                $query->join('brands', 'products.brand_id', '=', 'brands.id')
                      ->orderBy('brands.name', $sortDirection === 'asc' ? 'asc' : 'desc')
                      ->select('products.*');
            } else {
                $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
            }
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = min((int) $request->per_page, 100) ?: 20;
        $products = $query->paginate($perPage);

        return ProductResource::collection($products);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
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

        try {
            $subscribers = StoreSubscriber::where('is_active', true)->get();
            foreach ($subscribers as $subscriber) {
                Mail::to($subscriber->email)->send(new NewProductNotificationMail($product, $subscriber));
            }
        } catch (\Throwable $e) {
            \Log::error('Failed to send new product notification: ' . $e->getMessage());
        }

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
            'brand_id' => 'nullable|exists:brands,id',
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
            'images' => collect($uploaded)->map(fn($p) => '/storage/' . $p),
        ]);
    }

    public function deleteImage(Request $request, Product $product)
    {
        $request->validate([
            'image' => 'required|string',
        ]);

        $image = $request->image;
        $images = $product->images ?? [];

        $relativeImage = ltrim($image, '/');
        if (str_starts_with($relativeImage, 'storage/')) {
            $relativeImage = substr($relativeImage, strlen('storage/'));
        }

        $images = array_filter($images, fn($i) => $i !== $relativeImage);
        $product->update(['images' => array_values($images)]);

        Storage::disk('public')->delete($relativeImage);

        return response()->json(['message' => 'Gambar berhasil dihapus']);
    }

    public function reorderImages(Request $request, Product $product)
    {
        $request->validate([
            'images' => 'required|array',
        ]);

        $normalized = collect($request->images)->map(function ($img) {
            $relative = ltrim($img, '/');
            if (str_starts_with($relative, 'storage/')) {
                $relative = substr($relative, strlen('storage/'));
            }
            return $relative;
        })->filter()->values()->all();

        $product->update(['images' => $normalized]);

        return response()->json(['message' => 'Urutan gambar berhasil disimpan']);
    }

    /**
     * Duplicate a product.
     */
    public function duplicate(Product $product)
    {
        $newProduct = $product->replicate();
        $newProduct->name = $product->name . ' (Copy)';
        $newProduct->slug = $product->slug . '-copy-' . uniqid();
        $newProduct->sku = $product->sku ? $product->sku . '-COPY' : null;
        $newProduct->save();

        return new ProductResource($newProduct);
    }

    /**
     * Bulk delete products.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:products,id',
        ]);

        $ids = $request->ids;
        $products = Product::whereIn('id', $ids)->get();
        $count = $products->count();

        foreach ($products as $product) {
            if ($product->images) {
                foreach ($product->images as $image) {
                    Storage::disk('public')->delete($image);
                }
            }
            $product->delete();
        }

        return response()->json([
            'message' => "{$count} produk berhasil dihapus",
        ]);
    }

    /**
     * Bulk toggle active status.
     */
    public function bulkToggleStatus(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:products,id',
            'is_active' => 'required|boolean',
        ]);

        $ids = $request->ids;
        $isActive = $request->boolean('is_active');
        $count = Product::whereIn('id', $ids)->update(['is_active' => $isActive]);

        $statusText = $isActive ? 'Aktif' : 'Nonaktif';

        return response()->json([
            'message' => "{$count} produk berhasil diubah statusnya menjadi {$statusText}",
        ]);
    }

    /**
     * Bulk toggle featured status.
     */
    public function bulkToggleFeatured(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:products,id',
            'is_featured' => 'required|boolean',
        ]);

        $ids = $request->ids;
        $isFeatured = $request->boolean('is_featured');
        $count = Product::whereIn('id', $ids)->update(['is_featured' => $isFeatured]);

        return response()->json([
            'message' => "{$count} produk berhasil diubah status unggulannya",
        ]);
    }

    /**
     * Export products as CSV.
     */
    public function exportCsv(Request $request)
    {
        $query = Product::query()->with('category');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $products = $query->orderBy('created_at', 'desc')->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="products-export-' . date('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($products) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($file, [
                'Nama', 'Slug', 'SKU', 'Kategori', 'Harga', 'Harga Diskon',
                'Stok', 'Min Order', 'Unit', 'Status', 'Unggulan', 'Tanggal Dibuat'
            ]);

            foreach ($products as $product) {
                fputcsv($file, [
                    $product->name,
                    $product->slug,
                    $product->sku ?? '-',
                    $product->category?->name ?? '-',
                    $product->price,
                    $product->discount_price ?? '-',
                    $product->stock,
                    $product->min_order,
                    $product->unit,
                    $product->is_active ? 'Aktif' : 'Nonaktif',
                    $product->is_featured ? 'Ya' : 'Tidak',
                    $product->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}