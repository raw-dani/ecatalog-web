<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserManagementSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            SettingSeeder::class,
            BankAccountSeeder::class,
        ]);
    }
}
