<?php

namespace App\Console\Commands;

use App\Services\LicenseService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ActivateLicense extends Command
{
    protected $signature = 'license:activate';
    protected $description = 'Activate application license for current device';

    private LicenseService $licenseService;

    public function __construct(LicenseService $licenseService)
    {
        parent::__construct();
        $this->licenseService = $licenseService;
    }

    public function handle(): int
    {
        if (empty(config('license.server_url')) || empty(config('license.api_key')) || empty(config('license.license_key'))) {
            $this->error('License configuration is not complete. Please set LICENSE_SERVER_URL, LICENSE_API_KEY, and APP_LICENSE_KEY in .env');

            return self::FAILURE;
        }

        $this->info('Activating license...');
        $this->line('License Key: ' . config('license.license_key'));
        $this->line('Platform: ' . config('license.platform'));
        $this->line('Domain: ' . $this->licenseService->getDomain());
        $this->line('Username: ' . ($this->licenseService->getUsername() ?? '(none)'));

        $fingerprint = $this->licenseService->generateFingerprint();
        $this->line('Fingerprint: ' . $fingerprint);

        $result = $this->licenseService->activate();

        if (($result['status'] ?? '') === 'success') {
            $this->info('License activated successfully!');

            if (!empty($result['data']['token'])) {
                $this->line('Token cached for future verifications.');
            }

            if (!empty($result['data']['expires_at'])) {
                $this->line('Expires at: ' . $result['data']['expires_at']);
            }

            return self::SUCCESS;
        }

        $this->error('License activation failed: ' . ($result['message'] ?? 'Unknown error'));

        if (!empty($result['code'])) {
            $this->line('Error code: ' . $result['code']);
        }

        Log::alert('License activation failed', [
            'code' => $result['code'] ?? null,
            'message' => $result['message'] ?? null,
            'data' => $result['data'] ?? null,
        ]);

        return self::FAILURE;
    }
}
