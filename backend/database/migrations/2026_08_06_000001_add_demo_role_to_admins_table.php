<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE admins MODIFY COLUMN role ENUM('super_admin', 'admin', 'manager', 'karyawan', 'demo') NOT NULL DEFAULT 'admin'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE admins MODIFY COLUMN role ENUM('super_admin', 'admin', 'manager', 'karyawan') NOT NULL DEFAULT 'admin'");
    }
};
