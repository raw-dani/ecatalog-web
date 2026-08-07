<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Admin extends Authenticatable
{
    use HasFactory, HasApiTokens;

    protected $fillable = [
        'name', 'email', 'avatar', 'password', 'role', 'is_active', 'last_login_at',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_login_at' => 'datetime',
        'email_verified_at' => 'datetime',
    ];

    /**
     * Valid roles that can be assigned.
     */
    public static array $validRoles = ['super_admin', 'admin', 'manager', 'karyawan', 'demo'];

    /**
     * Get the roles for the admin (many-to-many via role_admin pivot).
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_admin')
            ->withTimestamps();
    }
}
