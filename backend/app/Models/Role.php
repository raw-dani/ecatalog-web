<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'guard_name',
    ];

    public function admins(): BelongsToMany
    {
        return $this->belongsToMany(Admin::class, 'role_admin')
            ->withTimestamps();
    }
}