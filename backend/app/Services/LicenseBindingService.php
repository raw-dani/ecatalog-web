<?php

namespace App\Services;

use App\Models\LicenseInstallation;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class LicenseBindingService
{
    private const FINGERPRINT_CACHE_KEY = 'license_machine_fingerprint';
    private const INSTALL_ID_CACHE_KEY = 'license_install_id';

    public function getMachineFingerprint(): string
    {
        $cached = Cache::get(self::FINGERPRINT_CACHE_KEY);
        if (is_string($cached) && !empty($cached)) {
            return $cached;
        }

        $components = [
            $this->getMacAddress(),
            $this->getHostname(),
            $this->getOsIdentifier(),
            $this->getDiskSerial(),
            $this->getMachineId(),
        ];

        $raw = implode('|', array_filter($components, fn ($v) => !empty($v)));
        $fingerprint = hash('sha256', $raw);

        Cache::forever(self::FINGERPRINT_CACHE_KEY, $fingerprint);

        return $fingerprint;
    }

    public function getInstallId(): string
    {
        $cached = Cache::get(self::INSTALL_ID_CACHE_KEY);
        if (is_string($cached) && !empty($cached)) {
            return $cached;
        }

        $installId = (string) Str::uuid();
        Cache::forever(self::INSTALL_ID_CACHE_KEY, $installId);

        return $installId;
    }

    public function getInstallInfo(): array
    {
        return [
            'install_id' => $this->getInstallId(),
            'machine_fingerprint' => $this->getMachineFingerprint(),
            'mac_address' => $this->getMacAddress(),
            'hostname' => $this->getHostname(),
            'os' => $this->getOsIdentifier(),
            'php_version' => phpversion(),
        ];
    }

    public function getCurrentInstallation(?string $licenseKey = null): ?LicenseInstallation
    {
        $licenseKey = $licenseKey ?? config('license.license_key');
        if (empty($licenseKey)) {
            return null;
        }

        return LicenseInstallation::query()
            ->where('license_key', $licenseKey)
            ->where('install_id', $this->getInstallId())
            ->first();
    }

    public function isBoundToCurrentMachine(): bool
    {
        $installation = $this->getCurrentInstallation();
        return $installation !== null && $installation->is_active === true;
    }

    public function bind(string $licenseKey, array $payload = []): LicenseInstallation
    {
        $info = $this->getInstallInfo();

        LicenseInstallation::query()
            ->where('license_key', $licenseKey)
            ->where('install_id', $info['install_id'])
            ->update(['is_active' => false, 'unbound_at' => now()]);

        $installation = LicenseInstallation::updateOrCreate(
            [
                'license_key' => $licenseKey,
                'install_id' => $info['install_id'],
            ],
            [
                'machine_fingerprint' => $info['machine_fingerprint'],
                'mac_address' => $info['mac_address'],
                'hostname' => $info['hostname'],
                'os' => $info['os'],
                'php_version' => $info['php_version'],
                'server_ip' => $this->getServerIp(),
                'domain' => $payload['domain'] ?? ($_SERVER['HTTP_HOST'] ?? null),
                'username' => $payload['username'] ?? ($_ENV['APP_USERNAME'] ?? null),
                'is_active' => true,
                'bound_at' => now(),
                'last_seen_at' => now(),
                'unbound_at' => null,
                'notes' => $payload['notes'] ?? null,
            ]
        );

        $this->clearVerifyCache();
        $this->rememberBound();

        Log::info('License installation bound', [
            'license_key' => $licenseKey,
            'install_id' => $info['install_id'],
        ]);

        return $installation;
    }

    public function unbind(string $licenseKey, ?string $reason = null): bool
    {
        $info = $this->getInstallInfo();

        $installation = LicenseInstallation::query()
            ->where('license_key', $licenseKey)
            ->where('install_id', $info['install_id'])
            ->where('is_active', true)
            ->first();

        if (!$installation) {
            return false;
        }

        $installation->update([
            'is_active' => false,
            'unbound_at' => now(),
            'notes' => $reason ?? $installation->notes,
        ]);

        $this->clearVerifyCache();
        $this->forgetBound();

        Log::info('License installation unbound', [
            'license_key' => $licenseKey,
            'install_id' => $info['install_id'],
            'reason' => $reason,
        ]);

        return true;
    }

    public function touch(): void
    {
        $installation = $this->getCurrentInstallation();
        if ($installation && $installation->is_active) {
            $installation->update(['last_seen_at' => now()]);
            $this->rememberBound();
        }
    }

    public function clearVerifyCache(): void
    {
        $fingerprint = $this->getMachineFingerprint();
        Cache::forget('license_verify_' . md5($fingerprint));
        Cache::forget('license_verify_' . md5($this->getLegacyFingerprint()));
        Cache::forget('license_token');
    }

    private function rememberBound(): void
    {
        $licenseKey = config('license.license_key');
        if (!empty($licenseKey)) {
            Cache::put('license_bound_' . md5($licenseKey), true, now()->addDays(30));
        }
    }

    private function forgetBound(): void
    {
        $licenseKey = config('license.license_key');
        if (!empty($licenseKey)) {
            Cache::forget('license_bound_' . md5($licenseKey));
        }
    }

    private function getLegacyFingerprint(): string
    {
        $domain = config('license.domain') ?? ($_SERVER['HTTP_HOST'] ?? 'unknown');
        $username = config('license.username') ?? ($_ENV['APP_USERNAME'] ?? '');

        return hash('sha256', $domain . '|' . $username);
    }

    private function getMacAddress(): ?string
    {
        if (!function_exists('php_uname')) {
            return null;
        }

        try {
            if (strtolower(PHP_OS_FAMILY) === 'linux') {
                $output = @shell_exec("ip -o link show 2>/dev/null | awk '$2 != \"lo\" {print $2, $17}' | head -1");
                if (is_string($output) && preg_match('/^\S+\s+([0-9a-f:]{17})/i', $output, $matches)) {
                    return strtolower($matches[1]);
                }

                $output = @shell_exec("cat /sys/class/net/$(hostname 2>/dev/null)/address 2>/dev/null");
                if (is_string($output) && preg_match('/([0-9a-f:]{17})/i', $output, $matches)) {
                    return strtolower($matches[1]);
                }
            } elseif (strtolower(PHP_OS_FAMILY) === 'windows') {
                $output = @shell_exec('getmac /NH /FO CSV 2>NUL');
                if (is_string($output) && preg_match('/"([0-9A-F-]{17})"/i', $output, $matches)) {
                    return strtolower(str_replace('-', ':', $matches[1]));
                }
            } elseif (strtolower(PHP_OS_FAMILY) === 'darwin') {
                $output = @shell_exec("ifconfig en0 2>/dev/null | awk '/ether/{print $2}'");
                if (is_string($output) && preg_match('/([0-9a-f:]{17})/i', $output, $matches)) {
                    return strtolower($matches[1]);
                }
            }
        } catch (\Throwable $e) {
            Log::debug('LicenseBinding: failed to read MAC address', ['error' => $e->getMessage()]);
        }

        return null;
    }

    private function getHostname(): ?string
    {
        if (function_exists('gethostname')) {
            $hostname = @gethostname();
            if ($hostname !== false && !empty($hostname)) {
                return $hostname;
            }
        }

        return isset($_SERVER['SERVER_NAME']) ? (string) $_SERVER['SERVER_NAME'] : null;
    }

    private function getOsIdentifier(): ?string
    {
        return PHP_OS_FAMILY . ' ' . php_uname('r');
    }

    private function getDiskSerial(): ?string
    {
        try {
            if (strtolower(PHP_OS_FAMILY) === 'linux') {
                $output = @shell_exec("lsblk -ndo SERIAL 2>/dev/null | head -1");
                if (is_string($output) && !empty(trim($output))) {
                    return trim($output);
                }

                $output = @shell_exec("find / -maxdepth 4 -name 'serial' -path '*/sys/block/*' 2>/dev/null | head -1");
                if (is_string($output) && !empty(trim($output))) {
                    $serial = @file_get_contents(trim($output));
                    if ($serial !== false && trim($serial) !== '') {
                        return trim($serial);
                    }
                }
            } elseif (strtolower(PHP_OS_FAMILY) === 'windows') {
                $output = @shell_exec('wmic diskdrive get serialnumber /value 2>NUL');
                if (is_string($output) && preg_match('/SerialNumber=(.+)/i', $output, $matches)) {
                    return trim($matches[1]);
                }
            }
        } catch (\Throwable $e) {
            Log::debug('LicenseBinding: failed to read disk serial', ['error' => $e->getMessage()]);
        }

        return null;
    }

    private function getMachineId(): ?string
    {
        try {
            if (strtolower(PHP_OS_FAMILY) === 'linux') {
                $machineId = @file_get_contents('/etc/machine-id');
                if ($machineId !== false && trim($machineId) !== '') {
                    return trim($machineId);
                }

                $machineId = @file_get_contents('/var/lib/dbus/machine-id');
                if ($machineId !== false && trim($machineId) !== '') {
                    return trim($machineId);
                }
            }
        } catch (\Throwable $e) {
            Log::debug('LicenseBinding: failed to read machine-id', ['error' => $e->getMessage()]);
        }

        return null;
    }

    private function getServerIp(): ?string
    {
        if (!empty($_SERVER['SERVER_ADDR']) && $_SERVER['SERVER_ADDR'] !== '0.0.0.0') {
            return $_SERVER['SERVER_ADDR'];
        }

        if (!empty($_SERVER['LOCAL_ADDR'])) {
            return $_SERVER['LOCAL_ADDR'];
        }

        try {
            if (strtolower(PHP_OS_FAMILY) === 'linux') {
                $output = @shell_exec("hostname -I 2>/dev/null | awk '{print $1}'");
                if (is_string($output) && !empty(trim($output))) {
                    return trim($output);
                }
            } elseif (strtolower(PHP_OS_FAMILY) === 'windows') {
                $output = @shell_exec('ipconfig | findstr /R "IPv4" 2>NUL');
                if (is_string($output) && preg_match('/\d+\.\d+\.\d+\.\d+/', $output, $matches)) {
                    return $matches[0];
                }
            }
        } catch (\Throwable $e) {
            Log::debug('LicenseBinding: failed to detect IP', ['error' => $e->getMessage()]);
        }

        return null;
    }
}