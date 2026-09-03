<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LicenseInstallation extends Model
{
    protected $fillable = [
        'license_key',
        'install_id',
        'machine_fingerprint',
        'mac_address',
        'hostname',
        'os',
        'php_version',
        'server_ip',
        'domain',
        'username',
        'is_active',
        'bound_at',
        'last_seen_at',
        'unbound_at',
        'notes',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'bound_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'unbound_at' => 'datetime',
    ];
}