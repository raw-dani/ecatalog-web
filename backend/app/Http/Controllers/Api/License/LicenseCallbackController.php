<?php

namespace App\Http\Controllers\Api\License;

use App\Http\Controllers\Controller;
use App\Services\LicenseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LicenseCallbackController extends Controller
{
    private LicenseService $licenseService;

    public function __construct(LicenseService $licenseService)
    {
        $this->licenseService = $licenseService;
    }

    public function handle(Request $request): JsonResponse
    {
        $payload = $request->all();

        if (!$this->verifySignature($payload)) {
            Log::warning('License webhook invalid signature', [
                'ip' => $request->ip(),
                'payload_keys' => array_keys($payload),
            ]);

            return response()->json([
                'status' => 'error',
                'code' => 403,
                'message' => 'Invalid signature',
            ], 403);
        }

        $event = $payload['event'] ?? null;
        $licenseKey = $payload['license_key'] ?? null;

        if (!$event || !$licenseKey) {
            return response()->json([
                'status' => 'error',
                'code' => 422,
                'message' => 'Missing event or license_key',
            ], 422);
        }

        if ($licenseKey !== config('license.license_key')) {
            Log::warning('License webhook license_key mismatch', [
                'expected' => config('license.license_key'),
                'received' => $licenseKey,
            ]);

            return response()->json([
                'status' => 'error',
                'code' => 403,
                'message' => 'License key mismatch',
            ], 403);
        }

        switch ($event) {
            case 'license.suspended':
                $this->licenseService->applySuspended($licenseKey, $payload['suspended_at'] ?? null);
                Log::info('License suspended via webhook', ['license_key' => $licenseKey]);
                break;

            case 'license.reactivated':
                $this->licenseService->applyReactivated($licenseKey);
                Log::info('License reactivated via webhook', ['license_key' => $licenseKey]);
                break;

            default:
                return response()->json([
                    'status' => 'error',
                    'code' => 422,
                    'message' => 'Unknown event',
                ], 422);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Callback processed',
        ]);
    }

    private function verifySignature(array $payload): bool
    {
        if (empty($payload['signature'])) {
            return false;
        }

        $secret = config('license.webhook_secret');

        if (empty($secret)) {
            Log::error('License webhook secret not configured');
            return false;
        }

        $providedSignature = $payload['signature'];

        $dataToVerify = $payload;
        unset($dataToVerify['signature']);

        $json = json_encode($dataToVerify, JSON_UNESCAPED_SLASHES);
        $expectedSignature = hash_hmac('sha256', $json, $secret);

        return hash_equals($expectedSignature, $providedSignature);
    }
}