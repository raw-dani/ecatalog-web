<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LicenseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LicenseController extends Controller
{
    private LicenseService $licenseService;

    public function __construct(LicenseService $licenseService)
    {
        $this->licenseService = $licenseService;
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
        $httpCode = $result['http_code'] ?? 500;

        $response = [
            'status' => $isValid ? 'valid' : 'invalid',
            'license_key' => config('license.license_key'),
            'fingerprint' => $fingerprint,
            'platform' => config('license.platform'),
            'has_token' => !empty($cachedToken),
            'message' => $result['message'] ?? 'Unknown status',
        ];

        if ($isValid && !empty($result['data'])) {
            $response['data'] = $result['data'];
        }

        return response()->json($response, $isValid ? 200 : $httpCode);
    }
}
