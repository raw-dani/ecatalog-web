<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class UserManagementSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
        ]);
    }
}
