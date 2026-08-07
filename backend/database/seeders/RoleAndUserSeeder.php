<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

class RoleAndUserSeeder extends Seeder
{
    public function run(): void
    {
        // Create roles
        $roles = ['super_admin', 'admin', 'manager', 'karyawan', 'demo'];
        $createdRoles = [];
        foreach ($roles as $roleName) {
            $createdRoles[$roleName] = Role::firstOrCreate([
                'name' => $roleName,
                'guard_name' => 'admin',
            ]);
        }

        // Create sample users for each role
        $users = [
            [
                'name' => 'Admin User',
                'email' => 'admin@tokoonline.com',
                'password' => Hash::make('password'),
                'role' => 'super_admin',
                'is_active' => true,
            ],
            [
                'name' => 'Demo User',
                'email' => 'demo@tokoonline.com',
                'password' => Hash::make('password'),
                'role' => 'demo',
                'is_active' => true,
            ],
            [
                'name' => 'Manager User',
                'email' => 'manager@tokoonline.com',
                'password' => Hash::make('password'),
                'role' => 'manager',
                'is_active' => true,
            ],
            [
                'name' => 'Karyawan User',
                'email' => 'karyawan@tokoonline.com',
                'password' => Hash::make('password'),
                'role' => 'karyawan',
                'is_active' => true,
            ],
        ];

        foreach ($users as $userData) {
            $admin = Admin::firstOrCreate(
                ['email' => $userData['email']],
                $userData
            );

            // Assign role from roles table
            $roleName = $userData['role'];
            $allRoleIds = collect($createdRoles)->pluck('id')->values()->toArray();

            if ($roleName === 'super_admin' || $roleName === 'demo') {
                // Super admin and demo get all roles
                $admin->roles()->sync($allRoleIds);
            } elseif (isset($createdRoles[$roleName])) {
                $admin->roles()->sync([$createdRoles[$roleName]->id]);
            }
        }
    }
}