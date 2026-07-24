<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BankAccount;

class BankAccountSeeder extends Seeder
{
    public function run(): void
    {
        $banks = [
            ['bank_name' => 'BCA', 'account_number' => '1234567890', 'account_name' => 'PT Toko Online Kami', 'branch' => 'Jakarta', 'sort_order' => 1],
            ['bank_name' => 'Mandiri', 'account_number' => '0987654321', 'account_name' => 'PT Toko Online Kami', 'branch' => 'Jakarta', 'sort_order' => 2],
            ['bank_name' => 'BNI', 'account_number' => '1122334455', 'account_name' => 'PT Toko Online Kami', 'branch' => 'Jakarta', 'sort_order' => 3],
            ['bank_name' => 'BRI', 'account_number' => '5566778899', 'account_name' => 'PT Toko Online Kami', 'branch' => 'Jakarta', 'sort_order' => 4],
        ];

        foreach ($banks as $bank) {
            BankAccount::create($bank);
        }
    }
}
