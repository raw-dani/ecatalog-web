<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $roles = ['admin', 'manager', 'karyawan'];
        $createdRoles = [];
        foreach ($roles as $roleName) {
            $createdRoles[$roleName] = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'admin',
            ]);
        }

        $superAdmin = Admin::firstOrCreate(
            ['email' => 'admin@tokoonline.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );

        $superAdmin->roles()->sync(collect($createdRoles)->pluck('id')->values()->toArray());
    }
}
