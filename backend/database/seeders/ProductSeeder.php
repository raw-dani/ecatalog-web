<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            ['category_id' => 1, 'name' => 'Smartphone X200', 'slug' => 'smartphone-x200', 'description' => 'Smartphone dengan kamera 48MP dan baterai 5000mAh', 'price' => 2500000, 'discount_price' => 2300000, 'stock' => 50, 'min_order' => 1, 'unit' => 'pcs', 'is_featured' => true],
            ['category_id' => 1, 'name' => 'Laptop Pro 15', 'slug' => 'laptop-pro-15', 'description' => 'Laptop performa tinggi untuk profesional', 'price' => 12000000, 'stock' => 20, 'min_order' => 1, 'unit' => 'pcs', 'is_featured' => true],
            ['category_id' => 1, 'name' => 'Wireless Earbuds', 'slug' => 'wireless-earbuds', 'description' => 'Earbuds Bluetooth dengan noise cancelling', 'price' => 350000, 'discount_price' => 299000, 'stock' => 100, 'min_order' => 1, 'unit' => 'pcs', 'is_featured' => true],
            ['category_id' => 2, 'name' => 'Kemeja Pria Formal', 'slug' => 'kemeja-pria-formal', 'description' => 'Kemeja katun premium untuk formal', 'price' => 150000, 'stock' => 200, 'min_order' => 1, 'unit' => 'pcs', 'is_featured' => true],
            ['category_id' => 2, 'name' => 'Dress Wanita', 'slug' => 'dress-wanita', 'description' => 'Dress elegan untuk acara spesial', 'price' => 250000, 'discount_price' => 199000, 'stock' => 80, 'min_order' => 1, 'unit' => 'pcs', 'is_featured' => true],
            ['category_id' => 3, 'name' => 'Rice Cooker Digital', 'slug' => 'rice-cooker-digital', 'description' => 'Rice cooker 2L dengan fitur智能', 'price' => 450000, 'stock' => 30, 'min_order' => 1, 'unit' => 'pcs', 'is_featured' => true],
            ['category_id' => 4, 'name' => 'Vitamin C 1000mg', 'slug' => 'vitamin-c-1000mg', 'description' => 'Suplemen vitamin C untuk daya tahan tubuh', 'price' => 85000, 'stock' => 150, 'min_order' => 1, 'unit' => 'botol', 'is_featured' => true],
            ['category_id' => 5, 'name' => 'Sepatu Lari', 'slug' => 'sepatu-lari', 'description' => 'Sepatu lari ringan dan nyaman', 'price' => 500000, 'discount_price' => 399000, 'stock' => 40, 'min_order' => 1, 'unit' => 'pasang', 'is_featured' => true],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}
