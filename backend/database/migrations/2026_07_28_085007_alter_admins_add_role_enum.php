<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // MySQL doesn't support ALTER ENUM directly, so we use raw query
        DB::statement("ALTER TABLE admins MODIFY COLUMN role ENUM('super_admin', 'admin', 'manager', 'karyawan') NOT NULL DEFAULT 'admin'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE admins MODIFY COLUMN role ENUM('super_admin', 'admin', 'staff') NOT NULL DEFAULT 'admin'");
    }
};