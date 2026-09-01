<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteVisit extends Model
{
    protected $fillable = [
        'path',
        'referrer',
        'user_agent',
        'ip',
        'session_id',
    ];
}
