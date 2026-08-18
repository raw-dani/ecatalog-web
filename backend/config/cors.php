<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'admin/*', 'sanctum/csrf-cookie', 'settings', 'categories', 'products', 'cart', 'orders', 'bank-accounts', 'license/*', 'verify-license'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['https://ecatalog.gmteknologi.com', 'https://admin-ecatalog.gmteknologi.com'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
