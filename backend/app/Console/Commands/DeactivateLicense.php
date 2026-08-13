<?php

namespace App\Console\Commands;

use App\Services\LicenseService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class DeactivateLicense extends Command
{
    protected $signature = 'license:deactivate';
    protected $description = 'Deactivate application license for current device';

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

        $this->warn('Deactivating license...');
        $this->line('License Key: ' . config('license.license_key'));
        $this->line('Domain: ' . $this->licenseService->getDomain());

        $result = $this->licenseService->deactivate();

        if (($result['status'] ?? '') === 'success') {
            $this->info('License deactivated successfully!');

            return self::SUCCESS;
        }

        $this->error('License deactivation failed: ' . ($result['message'] ?? 'Unknown error'));

        if (!empty($result['code'])) {
            $this->line('Error code: ' . $result['code']);
        }

        Log::alert('License deactivation failed', [
            'code' => $result['code'] ?? null,
            'message' => $result['message'] ?? null,
            'data' => $result['data'] ?? null,
        ]);

        return self::FAILURE;
    }
}
