<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class LicenseService
{
    private string $serverUrl;
    private string $apiKey;
    private string $licenseKey;
    private string $platform;

    public function __construct()
    {
        $this->serverUrl = rtrim(config('license.server_url'), '/');
        $this->apiKey = config('license.api_key');
        $this->licenseKey = config('license.license_key');
        $this->platform = config('license.platform', 'hosting');
    }

    public function getDomain(): string
    {
        return config('license.domain') ?? ($_SERVER['HTTP_HOST'] ?? 'unknown');
    }

    public function getUsername(): ?string
    {
        return config('license.username') ?? ($_ENV['APP_USERNAME'] ?? null);
    }

    public function verify(?string $fingerprint = null, ?string $domain = null, ?string $username = null): array
    {
        if (empty($this->serverUrl) || empty($this->apiKey) || empty($this->licenseKey)) {
            return [
                'status' => 'error',
                'code' => 500,
                'message' => 'Konfigurasi license belum lengkap.',
            ];
        }

        $fingerprint = $fingerprint ?? $this->generateFingerprint($domain, $username);
        $domain = $domain ?? $this->getDomain();
        $username = $username ?? $this->getUsername();

        $cacheKey = 'license_verify_' . md5($fingerprint);
        $cached = Cache::get($cacheKey);

        if ($cached && is_array($cached)) {
            return $cached;
        }

        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'X-API-Key' => $this->apiKey,
                    'Accept' => 'application/json',
                ])
                ->post($this->serverUrl . '/api/v1/verify', [
                    'license_key' => $this->licenseKey,
                    'fingerprint' => $fingerprint,
                    'platform' => $this->platform,
                    'domain' => $domain,
                    'device_info' => [
                        'username' => $username,
                        'php_version' => phpversion(),
                        'app_name' => config('app.name', 'eCatalog'),
                    ],
                ]);

            $result = $response->json();
            $result['http_code'] = $response->status();

            if ($response->successful() && ($result['status'] ?? '') === 'success') {
                $ttl = config('license.verify_ttl_hours', 24) * 60;
                Cache::put($cacheKey, $result, $ttl);

                if (!empty($result['data']['token'])) {
                    Cache::put('license_token', $result['data']['token'], $ttl);
                }
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('License verification failed: ' . $e->getMessage());

            return [
                'status' => 'error',
                'code' => 500,
                'message' => 'Gagal terhubung ke license server: ' . $e->getMessage(),
            ];
        }
    }

    public function activate(?string $fingerprint = null, ?string $domain = null, ?string $username = null): array
    {
        if (empty($this->serverUrl) || empty($this->apiKey) || empty($this->licenseKey)) {
            return [
                'status' => 'error',
                'code' => 500,
                'message' => 'Konfigurasi license belum lengkap.',
            ];
        }

        $fingerprint = $fingerprint ?? $this->generateFingerprint($domain, $username);
        $domain = $domain ?? $this->getDomain();
        $username = $username ?? $this->getUsername();

        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'X-API-Key' => $this->apiKey,
                    'Accept' => 'application/json',
                ])
                ->post($this->serverUrl . '/api/v1/activate', [
                    'license_key' => $this->licenseKey,
                    'fingerprint' => $fingerprint,
                    'platform' => $this->platform,
                    'domain' => $domain,
                    'device_info' => [
                        'username' => $username,
                        'php_version' => phpversion(),
                        'app_name' => config('app.name', 'eCatalog'),
                    ],
                ]);

            $result = $response->json();
            $result['http_code'] = $response->status();

            if ($response->successful() && ($result['status'] ?? '') === 'success' && !empty($result['data']['token'])) {
                $ttl = config('license.verify_ttl_hours', 24) * 60;
                Cache::put('license_token', $result['data']['token'], $ttl);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('License activation failed: ' . $e->getMessage());

            return [
                'status' => 'error',
                'code' => 500,
                'message' => 'Gagal terhubung ke license server: ' . $e->getMessage(),
            ];
        }
    }

    public function deactivate(?string $fingerprint = null, ?string $domain = null, ?string $username = null): array
    {
        if (empty($this->serverUrl) || empty($this->apiKey) || empty($this->licenseKey)) {
            return [
                'status' => 'error',
                'code' => 500,
                'message' => 'Konfigurasi license belum lengkap.',
            ];
        }

        $fingerprint = $fingerprint ?? $this->generateFingerprint($domain, $username);
        $domain = $domain ?? $this->getDomain();
        $username = $username ?? $this->getUsername();

        try {
            $token = Cache::get('license_token');

            $headers = [
                'X-API-Key' => $this->apiKey,
                'Accept' => 'application/json',
            ];

            if ($token) {
                $headers['X-Authorization'] = $token;
            }

            $response = Http::timeout(15)
                ->withHeaders($headers)
                ->post($this->serverUrl . '/api/v1/deactivate', [
                    'license_key' => $this->licenseKey,
                    'fingerprint' => $fingerprint,
                    'platform' => $this->platform,
                    'domain' => $domain,
                    'device_info' => [
                        'username' => $username,
                        'php_version' => phpversion(),
                        'app_name' => config('app.name', 'eCatalog'),
                    ],
                ]);

            $result = $response->json();
            $result['http_code'] = $response->status();

            if ($response->successful()) {
                Cache::forget('license_token');
                Cache::forget('license_verify_' . md5($fingerprint));
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('License deactivation failed: ' . $e->getMessage());

            return [
                'status' => 'error',
                'code' => 500,
                'message' => 'Gagal terhubung ke license server: ' . $e->getMessage(),
            ];
        }
    }

    public function generateFingerprint(?string $domain = null, ?string $username = null): string
    {
        $domain = $domain ?? $this->getDomain();
        $username = $username ?? $this->getUsername() ?? '';

        return hash('sha256', $domain . '|' . $username);
    }

    public function getCachedToken(): ?string
    {
        return Cache::get('license_token');
    }

    public function clearCache(): void
    {
        Cache::forget('license_token');
        $fingerprint = $this->generateFingerprint();
        Cache::forget('license_verify_' . md5($fingerprint));
    }
}
