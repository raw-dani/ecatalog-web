<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('license_installations', function (Blueprint $table) {
            $table->id();
            $table->string('license_key', 128)->index();
            $table->string('install_id', 64)->unique();
            $table->string('machine_fingerprint', 128);
            $table->string('mac_address', 64)->nullable();
            $table->string('hostname', 191)->nullable();
            $table->string('os', 64)->nullable();
            $table->string('php_version', 32)->nullable();
            $table->string('server_ip', 64)->nullable();
            $table->string('domain', 191)->nullable();
            $table->string('username', 128)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('bound_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamp('unbound_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['license_key', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('license_installations');
    }
};