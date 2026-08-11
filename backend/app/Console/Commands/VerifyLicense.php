<?php

namespace App\Console\Commands;

use App\Services\LicenseService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class VerifyLicense extends Command
{
    protected $signature = 'license:verify';
    protected $description = 'Verify application license status';

    private LicenseService $licenseService;

    public function __construct(LicenseService $licenseService)
    {
        parent::__construct();
        $this->licenseService = $licenseService;
    }

    public function handle(): int
    {
        if (empty(config('license.server_url')) || empty(config('license.api_key')) || empty(config('license.license_key'))) {
            $this->warn('License configuration is not complete. Skipping verification.');

            return self::SUCCESS;
        }

        $this->info('Verifying license...');

        $result = $this->licenseService->verify();

        if (($result['status'] ?? '') === 'success') {
            $this->info('License is valid.');

            if (!empty($result['data']['expires_at'])) {
                $this->line('Expires at: ' . $result['data']['expires_at']);
            }

            if (!empty($result['data']['customer_name'])) {
                $this->line('Customer: ' . $result['data']['customer_name']);
            }

            return self::SUCCESS;
        }

        $this->error('License verification failed: ' . ($result['message'] ?? 'Unknown error'));

        if (!empty($result['code'])) {
            $this->line('Error code: ' . $result['code']);
        }

        Log::alert('License verification failed', [
            'code' => $result['code'] ?? null,
            'message' => $result['message'] ?? null,
            'data' => $result['data'] ?? null,
        ]);

        return self::FAILURE;
    }
}
