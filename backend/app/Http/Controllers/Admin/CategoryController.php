<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Http\Resources\CategoryResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query()->withCount('products');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->boolean('paginate') !== false) {
            // Sorting
            $sortField = $request->sort_field ?? 'sort_order';
            $sortDirection = $request->sort_direction ?? 'asc';
            $allowedSortFields = ['name', 'slug', 'sort_order', 'is_active', 'created_at', 'products_count'];
            if (in_array($sortField, $allowedSortFields)) {
                $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
            } else {
                $query->orderBy('sort_order')->orderBy('name');
            }

            $perPage = min((int) $request->per_page, 100) ?: 20;
            $categories = $query->paginate($perPage);
            return CategoryResource::collection($categories);
        }

        $categories = $query->orderBy('sort_order')->orderBy('name')->get();
        return CategoryResource::collection($categories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories,slug',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $category = Category::create($validated);

        return new CategoryResource($category);
    }

    public function show(Category $category)
    {
        return new CategoryResource($category);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories,slug,' . $category->id,
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $category->update($validated);

        return new CategoryResource($category);
    }

    public function destroy(Category $category)
    {
        if ($category->image) {
            Storage::disk('public')->delete($category->image);
        }

        $category->delete();

        return response()->json(null, 204);
    }

    public function uploadImage(Request $request, Category $category)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ]);

        if ($category->image) {
            Storage::disk('public')->delete($category->image);
        }

        $path = $request->file('image')->store('categories', 'public');
        $category->update(['image' => $path]);

        return response()->json([
            'message' => 'Gambar berhasil diupload',
            'url' => asset('storage/' . $path),
        ]);
    }

    /**
     * Toggle active status.
     */
    public function toggleStatus(Category $category)
    {
        $category->update(['is_active' => !$category->is_active]);

        return new CategoryResource($category);
    }

    /**
     * Export categories as CSV.
     */
    public function exportCsv(Request $request)
    {
        $query = Category::query()->withCount('products');

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $categories = $query->orderBy('sort_order')->orderBy('name')->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="categories-export-' . date('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($categories) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($file, ['Nama', 'Slug', 'Deskripsi', 'Induk', 'Urutan', 'Status', 'Jumlah Produk', 'Tanggal Dibuat']);

            foreach ($categories as $category) {
                fputcsv($file, [
                    $category->name,
                    $category->slug,
                    $category->description ?? '-',
                    $category->parent ? $category->parent->name : '-',
                    $category->sort_order,
                    $category->is_active ? 'Aktif' : 'Nonaktif',
                    $category->products_count ?? 0,
                    $category->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}