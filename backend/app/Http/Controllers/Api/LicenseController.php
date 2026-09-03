<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LicenseBindingService;
use App\Services\LicenseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LicenseController extends Controller
{
    private LicenseService $licenseService;
    private LicenseBindingService $binding;

    public function __construct(LicenseService $licenseService, LicenseBindingService $binding)
    {
        $this->licenseService = $licenseService;
        $this->binding = $binding;
    }

    public function verify(Request $request): JsonResponse
    {
        $fingerprint = $request->input('fingerprint');
        $domain = $request->input('domain');
        $username = $request->input('username');

        $result = $this->licenseService->verify($fingerprint, $domain, $username);

        $httpCode = $result['http_code'] ?? 500;
        unset($result['http_code']);

        return response()->json($result, $httpCode);
    }

    public function activate(Request $request): JsonResponse
    {
        $fingerprint = $request->input('fingerprint');
        $domain = $request->input('domain');
        $username = $request->input('username');

        $result = $this->licenseService->activate($fingerprint, $domain, $username);

        $httpCode = $result['http_code'] ?? 500;
        unset($result['http_code']);

        return response()->json($result, $httpCode);
    }

    public function deactivate(Request $request): JsonResponse
    {
        $fingerprint = $request->input('fingerprint');
        $domain = $request->input('domain');
        $username = $request->input('username');

        $result = $this->licenseService->deactivate($fingerprint, $domain, $username);

        $httpCode = $result['http_code'] ?? 500;
        unset($result['http_code']);

        return response()->json($result, $httpCode);
    }

    public function status(Request $request): JsonResponse
    {
        $fingerprint = $this->licenseService->generateFingerprint();
        $cachedToken = $this->licenseService->getCachedToken();

        $result = $this->licenseService->verify($fingerprint);

        $isValid = ($result['status'] ?? '') === 'success';

        $response = [
            'status' => $isValid ? 'valid' : 'invalid',
            'license_key' => config('license.license_key'),
            'fingerprint' => $fingerprint,
            'platform' => config('license.platform'),
            'has_token' => !empty($cachedToken),
            'message' => $result['message'] ?? 'Unknown status',
            'binding' => [
                'install_id' => $this->binding->getInstallId(),
                'is_bound' => $this->binding->isBoundToCurrentMachine(),
                'info' => $this->binding->getInstallInfo(),
            ],
        ];

        if (!empty($result['code'])) {
            $response['code'] = $result['code'];
        }

        if ($isValid && !empty($result['data'])) {
            $response['data'] = $result['data'];
        }

        return response()->json($response, 200);
    }

    public function bind(Request $request): JsonResponse
    {
        $serverUrl = rtrim(config('license.server_url'), '/');
        $apiKey = config('license.api_key');
        $licenseKey = config('license.license_key');

        if (empty($serverUrl) || empty($apiKey) || empty($licenseKey)) {
            return response()->json([
                'status' => 'error',
                'code' => 500,
                'message' => 'Konfigurasi license belum lengkap.',
            ], 500);
        }

        $installInfo = $this->binding->getInstallInfo();
        $domain = $request->input('domain') ?? ($_SERVER['HTTP_HOST'] ?? null);
        $username = $request->input('username') ?? ($_ENV['APP_USERNAME'] ?? null);
        $transferToken = $request->input('transfer_token');

        try {
            $headers = [
                'X-API-Key' => $apiKey,
                'Accept' => 'application/json',
            ];

            if (!empty($transferToken)) {
                $headers['X-Transfer-Token'] = $transferToken;
            }

            $cachedToken = $this->licenseService->getCachedToken();
            if (!empty($cachedToken)) {
                $headers['X-Authorization'] = $cachedToken;
            }

            $response = Http::timeout(20)
                ->withHeaders($headers)
                ->post($serverUrl . '/api/v1/bind', [
                    'license_key' => $licenseKey,
                    'platform' => config('license.platform', 'hosting'),
                    'domain' => $domain,
                    'username' => $username,
                    'install_id' => $installInfo['install_id'],
                    'machine_fingerprint' => $installInfo['machine_fingerprint'],
                    'device_info' => [
                        'mac_address' => $installInfo['mac_address'],
                        'hostname' => $installInfo['hostname'],
                        'os' => $installInfo['os'],
                        'php_version' => $installInfo['php_version'],
                    ],
                ]);

            $result = $response->json();
            $httpCode = $response->status();
            $result['http_code'] = $httpCode;

            if ($response->successful() && ($result['status'] ?? '') === 'success') {
                $this->binding->bind($licenseKey, [
                    'domain' => $domain,
                    'username' => $username,
                    'notes' => $result['message'] ?? null,
                ]);
            } else {
                Log::warning('License bind failed at remote server', [
                    'license_key' => $licenseKey,
                    'install_id' => $installInfo['install_id'],
                    'result' => $result,
                ]);
            }

            unset($result['http_code']);
            return response()->json($result, $httpCode ?: 500);
        } catch (\Exception $e) {
            Log::error('License binding request failed: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'code' => 500,
                'message' => 'Gagal terhubung ke license server: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function bindingInfo(Request $request): JsonResponse
    {
        $installation = $this->binding->getCurrentInstallation();

        return response()->json([
            'install_info' => $this->binding->getInstallInfo(),
            'installation' => $installation,
            'is_bound' => $this->binding->isBoundToCurrentMachine(),
            'enforce_binding' => (bool) config('license.enforce_binding', true),
        ]);
    }
}
