<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use Illuminate\Http\Request;

class BankAccountController extends Controller
{
    public function index(Request $request)
    {
        $query = BankAccount::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('bank_name', 'like', "%{$search}%")
                  ->orWhere('account_number', 'like', "%{$search}%")
                  ->orWhere('account_name', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortField = $request->sort_field ?? 'sort_order';
        $sortDirection = $request->sort_direction ?? 'asc';
        $allowedSortFields = ['bank_name', 'account_number', 'account_name', 'is_active', 'sort_order'];
        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('sort_order');
        }

        $accounts = $query->get();

        return response()->json($accounts);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'bank_name' => 'required|string|max:100',
            'account_number' => 'required|string|max:100',
            'account_name' => 'required|string|max:255',
            'branch' => 'nullable|string|max:100',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $account = BankAccount::create($validated);

        return response()->json($account, 201);
    }

    public function show(BankAccount $bankAccount)
    {
        return response()->json($bankAccount);
    }

    public function update(Request $request, BankAccount $bankAccount)
    {
        $validated = $request->validate([
            'bank_name' => 'required|string|max:100',
            'account_number' => 'required|string|max:100',
            'account_name' => 'required|string|max:255',
            'branch' => 'nullable|string|max:100',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        $bankAccount->update($validated);

        return response()->json($bankAccount);
    }

    public function destroy(BankAccount $bankAccount)
    {
        $bankAccount->delete();

        return response()->json(null, 204);
    }

    /**
     * Toggle active status.
     */
    public function toggleStatus(BankAccount $bankAccount)
    {
        $bankAccount->update(['is_active' => !$bankAccount->is_active]);

        return response()->json($bankAccount);
    }
}