<?php

namespace App\Http\Middleware;

use App\Services\LicenseService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class CheckLicense
{
    private LicenseService $licenseService;

    public function __construct(LicenseService $licenseService)
    {
        $this->licenseService = $licenseService;
    }

    public function handle(Request $request, Closure $next): Response
    {
        if (empty(config('license.server_url')) || empty(config('license.api_key')) || empty(config('license.license_key'))) {
            return $next($request);
        }

        $result = $this->licenseService->verify();

        if (($result['status'] ?? '') === 'success') {
            return $next($request);
        }

        $code = $result['code'] ?? 403;
        $message = $result['message'] ?? 'Lisensi tidak valid atau kadaluarsa.';

        Log::warning('License check failed: ' . $message, [
            'code' => $code,
            'result' => $result,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'status' => 'error',
                'code' => $code,
                'message' => $message,
                'license_error' => true,
            ], $code);
        }

        return response()->json([
            'status' => 'error',
            'code' => $code,
            'message' => $message,
            'license_error' => true,
        ], $code);
    }
}
