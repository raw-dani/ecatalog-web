<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Elektronik', 'slug' => 'elektronik', 'description' => 'Perangkat elektronik dan aksesoris', 'sort_order' => 1],
            ['name' => 'Fashion', 'slug' => 'fashion', 'description' => 'Pakaian dan aksesoris fashion', 'sort_order' => 2],
            ['name' => 'Rumah Tangga', 'slug' => 'rumah-tangga', 'description' => 'Peralatan dan perlengkapan rumah tangga', 'sort_order' => 3],
            ['name' => 'Kesehatan', 'slug' => 'kesehatan', 'description' => 'Produk kesehatan dan kecantikan', 'sort_order' => 4],
            ['name' => 'Olahraga', 'slug' => 'olahraga', 'description' => 'Peralatan dan pakaian olahraga', 'sort_order' => 5],
            ['name' => 'Otomotif', 'slug' => 'otomotif', 'description' => 'Aksesoris dan perlengkapan kendaraan', 'sort_order' => 6],
            ['name' => 'Buku & Alat Tulis', 'slug' => 'buku-alat-tulis', 'description' => 'Buku, alat tulis, dan perlengkapan kantor', 'sort_order' => 7],
            ['name' => 'Makanan & Minuman', 'slug' => 'makanan-minuman', 'description' => 'Snack, makanan, dan minuman', 'sort_order' => 8],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
