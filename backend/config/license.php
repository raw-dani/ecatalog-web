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
    'failure_cache_ttl_minutes' => env('LICENSE_FAILURE_CACHE_TTL_MINUTES', 5),
    'webhook_secret' => env('LICENSE_WEBHOOK_SECRET', ''),
    'enforce_binding' => env('LICENSE_ENFORCE_BINDING', true),
    'transfer_token' => env('LICENSE_TRANSFER_TOKEN', ''),
];
