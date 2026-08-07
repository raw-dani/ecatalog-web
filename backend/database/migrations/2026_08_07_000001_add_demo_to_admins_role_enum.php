<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add 'demo' to the admins.role ENUM
        DB::statement("ALTER TABLE admins MODIFY COLUMN role ENUM('super_admin', 'admin', 'manager', 'karyawan', 'demo') NOT NULL DEFAULT 'admin'");
    }

    public function down(): void
    {
        // Revert to previous ENUM (without demo)
        DB::statement("ALTER TABLE admins MODIFY COLUMN role ENUM('super_admin', 'admin', 'manager', 'karyawan') NOT NULL DEFAULT 'admin'");
    }
};