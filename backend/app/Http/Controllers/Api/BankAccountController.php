<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;

class BankAccountController extends Controller
{
    public function index()
    {
        $accounts = BankAccount::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['bank_name', 'account_number', 'account_name', 'branch']);

        return response()->json($accounts);
    }
}
