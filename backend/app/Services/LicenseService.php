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
    private LicenseBindingService $binding;

    public function __construct(LicenseBindingService $binding)
    {
        $this->serverUrl = rtrim(config('license.server_url'), '/');
        $this->apiKey = config('license.api_key');
        $this->licenseKey = config('license.license_key');
        $this->platform = config('license.platform', 'hosting');
        $this->binding = $binding;
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

        $fingerprint = $fingerprint ?? $this->binding->getMachineFingerprint();
        $domain = $domain ?? $this->getDomain();
        $username = $username ?? $this->getUsername();

        if (!$this->binding->isBoundToCurrentMachine()) {
            $cached = $this->getCachedBlockedResponse();
            if ($cached) {
                return $cached;
            }

            $result = $this->doVerify($fingerprint, $domain, $username);

            if (($result['status'] ?? '') === 'success') {
                if (!empty($result['data']['bound']) && empty($result['data']['install_id'])) {
                    return $this->blockNotBound($result);
                }
            } else {
                $this->rememberBlockedResponse($result);
            }

            return $result;
        }

        $statusCacheKey = 'license_status_' . md5($this->licenseKey);
        $cachedStatus = Cache::get($statusCacheKey);
        if (is_array($cachedStatus) && ($cachedStatus['status'] ?? null) === 'suspended') {
            return [
                'status' => 'error',
                'code' => 403,
                'message' => 'License is suspended',
                'data' => $cachedStatus,
                'suspended_via_webhook' => true,
            ];
        }

        $cacheKey = 'license_verify_' . md5($fingerprint);
        $cached = Cache::get($cacheKey);

        if ($cached && is_array($cached) && ($cached['status'] ?? '') === 'success') {
            $this->binding->touch();
            return $cached;
        }

        $lock = Cache::lock('license_verify_lock_' . md5($fingerprint), 10);

        if ($lock->get()) {
            try {
                $cached = Cache::get($cacheKey);
                if ($cached && is_array($cached) && ($cached['status'] ?? '') === 'success') {
                    return $cached;
                }

                $result = $this->doVerify($fingerprint, $domain, $username);

                if (($result['status'] ?? '') === 'success') {
                    if (!empty($result['data']['install_id'])) {
                        $serverInstallId = $result['data']['install_id'];
                        if ($serverInstallId !== $this->binding->getInstallId()) {
                            return $this->blockInstallMismatch($result, $serverInstallId);
                        }
                    }

                    $ttl = config('license.verify_ttl_hours', 24) * 60;
                    Cache::put($cacheKey, $result, $ttl);

                    if (!empty($result['data']['token'])) {
                        Cache::put('license_token', $result['data']['token'], $ttl);
                    }

                    $this->binding->touch();
                } else {
                    $ttl = config('license.failure_cache_ttl_minutes', 5);
                    Cache::put($cacheKey, $result, $ttl);
                }

                return $result;
            } finally {
                $lock->release();
            }
        }

        sleep(1);

        $cached = Cache::get($cacheKey);
        if ($cached && is_array($cached)) {
            return $cached;
        }

        return [
            'status' => 'success',
            'code' => 200,
            'message' => 'License verification in progress, using cached allowance.',
            'pending' => true,
        ];
    }

    private function blockNotBound($previousResult = null): array
    {
        $result = [
            'status' => 'error',
            'code' => 403,
            'message' => 'License belum terikat (bound) ke server ini. Silakan lakukan aktivasi pindah server.',
            'license_error' => true,
            'binding_required' => true,
        ];

        $this->rememberBlockedResponse($result);
        Log::warning('License binding missing for current machine', [
            'license_key' => $this->licenseKey,
            'install_id' => $this->binding->getInstallId(),
        ]);

        return $result;
    }

    private function blockInstallMismatch(array $result, string $serverInstallId): array
    {
        $blocked = [
            'status' => 'error',
            'code' => 403,
            'message' => 'License terikat pada server lain. Aplikasi tidak dapat dijalankan di server ini.',
            'license_error' => true,
            'binding_required' => true,
            'bound_to_other_machine' => true,
            'data' => $result['data'] ?? null,
        ];

        Cache::put('license_verify_' . md5($this->binding->getMachineFingerprint()), $blocked, now()->addDays(7));
        $this->rememberBlockedResponse($blocked);

        Log::warning('License install_id mismatch (moved to new server)', [
            'server_install_id' => $serverInstallId,
            'local_install_id' => $this->binding->getInstallId(),
        ]);

        return $blocked;
    }

    private function getCachedBlockedResponse(): ?array
    {
        $key = 'license_block_' . md5($this->licenseKey . '|' . $this->binding->getInstallId());
        $cached = Cache::get($key);
        return is_array($cached) ? $cached : null;
    }

    private function rememberBlockedResponse(array $response): void
    {
        $key = 'license_block_' . md5($this->licenseKey . '|' . $this->binding->getInstallId());
        Cache::put($key, $response, now()->addDays(7));
    }

    private function doVerify(string $fingerprint, string $domain, string $username): array
    {
        try {
            $installInfo = $this->binding->getInstallInfo();

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
                    'install_id' => $installInfo['install_id'],
                    'machine_fingerprint' => $installInfo['machine_fingerprint'],
                    'device_info' => [
                        'username' => $username,
                        'php_version' => phpversion(),
                        'app_name' => config('app.name', 'eCatalog'),
                        'mac_address' => $installInfo['mac_address'],
                        'hostname' => $installInfo['hostname'],
                        'os' => $installInfo['os'],
                    ],
                ]);

            $result = $response->json();
            $result['http_code'] = $response->status();

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

        $fingerprint = $fingerprint ?? $this->binding->getMachineFingerprint();
        $domain = $domain ?? $this->getDomain();
        $username = $username ?? $this->getUsername();

        try {
            $installInfo = $this->binding->getInstallInfo();

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
                    'install_id' => $installInfo['install_id'],
                    'machine_fingerprint' => $installInfo['machine_fingerprint'],
                    'device_info' => [
                        'username' => $username,
                        'php_version' => phpversion(),
                        'app_name' => config('app.name', 'eCatalog'),
                        'mac_address' => $installInfo['mac_address'],
                        'hostname' => $installInfo['hostname'],
                        'os' => $installInfo['os'],
                    ],
                ]);

            $result = $response->json();
            $result['http_code'] = $response->status();

            if ($response->successful() && ($result['status'] ?? '') === 'success') {
                $ttl = config('license.verify_ttl_hours', 24) * 60;
                if (!empty($result['data']['token'])) {
                    Cache::put('license_token', $result['data']['token'], $ttl);
                }
                $this->binding->bind($this->licenseKey, [
                    'domain' => $domain,
                    'username' => $username,
                ]);
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

        $fingerprint = $fingerprint ?? $this->binding->getMachineFingerprint();
        $domain = $domain ?? $this->getDomain();
        $username = $username ?? $this->getUsername();

        try {
            $installInfo = $this->binding->getInstallInfo();
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
                    'install_id' => $installInfo['install_id'],
                    'machine_fingerprint' => $installInfo['machine_fingerprint'],
                    'device_info' => [
                        'username' => $username,
                        'php_version' => phpversion(),
                        'app_name' => config('app.name', 'eCatalog'),
                        'mac_address' => $installInfo['mac_address'],
                        'hostname' => $installInfo['hostname'],
                        'os' => $installInfo['os'],
                    ],
                ]);

            $result = $response->json();
            $result['http_code'] = $response->status();

            if ($response->successful()) {
                Cache::forget('license_token');
                Cache::forget('license_verify_' . md5($fingerprint));
                $this->binding->unbind($this->licenseKey, 'deactivate_called');
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
        return $this->binding->getMachineFingerprint();
    }

    public function getCachedToken(): ?string
    {
        return Cache::get('license_token');
    }

    public function clearCache(): void
    {
        $this->binding->clearVerifyCache();
    }

    public function applySuspended(string $licenseKey, ?string $suspendedAt = null): void
    {
        $payload = [
            'status' => 'suspended',
            'suspended_at' => $suspendedAt ?? now()->toDateTimeString(),
            'source' => 'webhook',
        ];

        Cache::put('license_status_' . md5($licenseKey), $payload, now()->addDays(7));

        $fingerprint = $this->binding->getMachineFingerprint();
        Cache::forget('license_verify_' . md5($fingerprint));
        Cache::forget('license_token');

        $blockedResponse = [
            'status' => 'error',
            'code' => 403,
            'message' => 'License is suspended',
            'data' => $payload,
            'suspended_via_webhook' => true,
        ];
        Cache::put('license_verify_' . md5($fingerprint), $blockedResponse, now()->addDays(7));
    }

    public function applyReactivated(string $licenseKey): void
    {
        Cache::forget('license_status_' . md5($licenseKey));

        $fingerprint = $this->binding->getMachineFingerprint();
        Cache::forget('license_verify_' . md5($fingerprint));
        Cache::forget('license_token');
    }

    public function applyRebound(string $licenseKey, string $installId, ?string $reason = null): void
    {
        Cache::put('license_rebound_' . md5($licenseKey), [
            'install_id' => $installId,
            'reason' => $reason,
            'timestamp' => now()->toDateTimeString(),
        ], now()->addDays(30));

        $fingerprint = $this->binding->getMachineFingerprint();
        Cache::forget('license_verify_' . md5($fingerprint));
        Cache::forget('license_token');
    }
}