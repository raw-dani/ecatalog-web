<?php

namespace App\Http\Middleware;

use App\Services\LicenseBindingService;
use App\Services\LicenseService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class CheckLicense
{
    private LicenseService $licenseService;
    private LicenseBindingService $binding;

    public function __construct(LicenseService $licenseService, LicenseBindingService $binding)
    {
        $this->licenseService = $licenseService;
        $this->binding = $binding;
    }

    public function handle(Request $request, Closure $next): Response
    {
        if (empty(config('license.server_url')) || empty(config('license.api_key')) || empty(config('license.license_key'))) {
            return $next($request);
        }

        if (config('license.enforce_binding', true) && !$this->binding->isBoundToCurrentMachine()) {
            Log::warning('License not bound to current server', [
                'install_id' => $this->binding->getInstallId(),
                'fingerprint' => substr($this->binding->getMachineFingerprint(), 0, 12) . '...',
            ]);

            return $this->block($request, 403, 'Aplikasi belum terikat ke server ini. Silakan lakukan binding license terlebih dahulu.', [
                'binding_required' => true,
            ]);
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

        return $this->block($request, $code, $message, [
            'binding_required' => $result['binding_required'] ?? false,
            'suspended_via_webhook' => $result['suspended_via_webhook'] ?? false,
            'bound_to_other_machine' => $result['bound_to_other_machine'] ?? false,
        ]);
    }

    private function block(Request $request, int $code, string $message, array $extra = []): Response
    {
        $payload = array_merge([
            'status' => 'error',
            'code' => $code,
            'message' => $message,
            'license_error' => true,
        ], $extra);

        if ($request->expectsJson()) {
            return response()->json($payload, $code);
        }

        return response()->json($payload, $code);
    }
}