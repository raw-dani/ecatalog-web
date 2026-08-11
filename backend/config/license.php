<?php

return [
    'server_url' => env('LICENSE_SERVER_URL', ''),
    'api_key' => env('LICENSE_API_KEY', ''),
    'license_key' => env('APP_LICENSE_KEY', ''),
    'platform' => env('LICENSE_PLATFORM', 'hosting'),
    'domain' => env('LICENSE_DOMAIN', null),
    'username' => env('LICENSE_USERNAME', null),
    'verify_ttl_hours' => env('LICENSE_VERIFY_TTL_HOURS', 24),
    'grace_period_hours' => env('LICENSE_GRACE_PERIOD_HOURS', 0),
];
