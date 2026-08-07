<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\ActivityLog;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserManagementController extends Controller
{
    /**
     * Check if the authenticated admin is a demo account.
     */
    private function isDemoUser(Request $request): bool
    {
        return $request->user()?->role === 'demo';
    }

    /**
     * Check if a target role is super_admin.
     */
    private function isSuperAdminRole(?string $role): bool
    {
        return $role === 'super_admin';
    }

    /**
     * Block demo account from managing super_admin users.
     *
     * Demo has all roles (including super_admin) via pivot, but must NOT
     * be able to create, modify, delete, or assign super_admin accounts.
     */
    private function authorizeSuperAdminMutation(Request $request, ?string $targetRole = null): void
    {
        if ($this->isDemoUser($request) && $this->isSuperAdminRole($targetRole)) {
            abort(403, 'Akun demo tidak diizinkan mengelola user Super Admin.');
        }
    }

    public function index(Request $request)
    {
        $query = Admin::query()->with('roles');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Sorting
        $sortField = $request->sort_field ?? 'created_at';
        $sortDirection = $request->sort_direction ?? 'desc';
        $allowedSortFields = ['name', 'email', 'role', 'is_active', 'created_at', 'last_login_at'];
        if (in_array($sortField, $allowedSortFields)) {
            $query->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = min((int) $request->per_page, 100) ?: 20;
        $admins = $query->paginate($perPage);

        return response()->json([
            'data' => $admins->items(),
            'total' => $admins->total(),
            'per_page' => $admins->perPage(),
            'current_page' => $admins->currentPage(),
            'last_page' => $admins->lastPage(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:admins,email',
            'password' => 'required|string|min:8',
            'role' => 'required|string|in:super_admin,admin,manager,karyawan,demo',
            'is_active' => 'boolean',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        // Demo cannot create super_admin accounts
        $this->authorizeSuperAdminMutation($request, $validated['role']);

        $validated['password'] = Hash::make($validated['password']);
        $validated['is_active'] = $validated['is_active'] ?? true;

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $admin = Admin::create($validated);

        $role = Role::where('name', $validated['role'])->first();
        if ($role) {
            $admin->roles()->sync([$role->id]);
        }

        // Log activity
        $this->logActivity(
            adminId: $request->user()->id,
            action: 'create',
            modelType: Admin::class,
            modelId: $admin->id,
            description: "Membuat user baru: {$admin->name} ({$admin->email})",
            newValues: $admin->toArray(),
            request: $request
        );

        return response()->json([
            'message' => 'Admin berhasil dibuat',
            'data' => $admin,
        ], 201);
    }

    public function show($id)
    {
        $admin = Admin::with('roles')->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'avatar' => $admin->avatar ? asset('storage/' . $admin->avatar) : null,
                'role' => $admin->role,
                'roles' => $admin->roles->pluck('name'),
                'is_active' => $admin->is_active,
                'last_login_at' => $admin->last_login_at,
                'email_verified_at' => $admin->email_verified_at,
                'created_at' => $admin->created_at,
                'updated_at' => $admin->updated_at,
            ],
        ]);
    }

    public function update(Request $request, $id)
    {
        $admin = Admin::findOrFail($id);
        $oldData = $admin->toArray();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:admins,email,' . $admin->id,
            'password' => 'nullable|string|min:8',
            'role' => 'required|string|in:super_admin,admin,manager,karyawan,demo',
            'is_active' => 'boolean',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        // Demo cannot modify a super_admin account or assign super_admin role
        $this->authorizeSuperAdminMutation($request, $admin->role);
        $this->authorizeSuperAdminMutation($request, $validated['role']);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            // Delete old avatar
            if ($admin->avatar) {
                Storage::disk('public')->delete($admin->avatar);
            }
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        } else {
            unset($validated['avatar']);
        }

        $admin->update($validated);

        $role = Role::where('name', $validated['role'])->first();
        if ($role) {
            $admin->roles()->sync([$role->id]);
        }

        // Log activity
        $this->logActivity(
            adminId: $request->user()->id,
            action: 'update',
            modelType: Admin::class,
            modelId: $admin->id,
            description: "Memperbarui user: {$admin->name} ({$admin->email})",
            oldValues: $oldData,
            newValues: $admin->toArray(),
            request: $request
        );

        return response()->json([
            'message' => 'Admin berhasil diperbarui',
            'data' => $admin,
        ]);
    }

    public function destroy($id)
    {
        $admin = Admin::findOrFail($id);
        $adminData = $admin->toArray();

        // Demo cannot delete a super_admin account
        $this->authorizeSuperAdminMutation(request(), $admin->role);

        // Delete avatar if exists
        if ($admin->avatar) {
            Storage::disk('public')->delete($admin->avatar);
        }

        $admin->delete();

        // Log activity (using request()->user() since we don't have $request param)
        $this->logActivity(
            adminId: request()->user()->id,
            action: 'delete',
            modelType: Admin::class,
            modelId: $id,
            description: "Menghapus user: {$adminData['name']} ({$adminData['email']})",
            oldValues: $adminData,
            request: request()
        );

        return response()->json(null, 204);
    }

    public function assignRole(Request $request, $id)
    {
        $admin = Admin::findOrFail($id);
        $oldRole = $admin->role;

        $request->validate([
            'role' => 'required|string|in:super_admin,admin,manager,karyawan,demo',
        ]);

        // Demo cannot assign super_admin role or modify a super_admin account
        $this->authorizeSuperAdminMutation($request, $admin->role);
        $this->authorizeSuperAdminMutation($request, $request->role);

        $admin->update([
            'role' => $request->role,
        ]);

        $role = Role::where('name', $request->role)->first();
        if ($role) {
            $admin->roles()->sync([$role->id]);
        }

        // Log activity
        $this->logActivity(
            adminId: $request->user()->id,
            action: 'update',
            modelType: Admin::class,
            modelId: $admin->id,
            description: "Mengubah role user {$admin->name} dari {$oldRole} menjadi {$request->role}",
            oldValues: ['role' => $oldRole],
            newValues: ['role' => $request->role],
            request: $request
        );

        return response()->json([
            'message' => 'Role berhasil diubah',
            'data' => $admin,
        ]);
    }

    /**
     * Upload avatar for a user.
     */
    public function uploadAvatar(Request $request, $id)
    {
        $admin = Admin::findOrFail($id);

        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        // Delete old avatar
        if ($admin->avatar) {
            Storage::disk('public')->delete($admin->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $admin->update(['avatar' => $path]);

        return response()->json([
            'message' => 'Avatar berhasil diupload',
            'data' => [
                'avatar' => asset('storage/' . $path),
            ],
        ]);
    }

    /**
     * Bulk delete users.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:admins,id',
        ]);

        $ids = $request->ids;
        $admins = Admin::whereIn('id', $ids)->get();
        $count = $admins->count();

        // Demo cannot bulk delete super_admin accounts
        $hasSuperAdmin = $admins->contains(fn($admin) => $admin->role === 'super_admin');
        if ($this->isDemoUser($request) && $hasSuperAdmin) {
            abort(403, 'Akun demo tidak diizinkan menghapus user Super Admin.');
        }

        foreach ($admins as $admin) {
            if ($admin->avatar) {
                Storage::disk('public')->delete($admin->avatar);
            }
            $admin->delete();
        }

        // Log activity
        $this->logActivity(
            adminId: $request->user()->id,
            action: 'bulk_delete',
            modelType: Admin::class,
            description: "Menghapus {$count} user secara massal (ID: " . implode(', ', $ids) . ")",
            oldValues: ['ids' => $ids],
            request: $request
        );

        return response()->json([
            'message' => "{$count} user berhasil dihapus",
        ]);
    }

    /**
     * Bulk toggle active status.
     */
    public function bulkToggleStatus(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:admins,id',
            'is_active' => 'required|boolean',
        ]);

        $ids = $request->ids;
        $isActive = $request->boolean('is_active');
        $count = Admin::whereIn('id', $ids)->update(['is_active' => $isActive]);

        $statusText = $isActive ? 'Aktif' : 'Nonaktif';

        // Log activity
        $this->logActivity(
            adminId: $request->user()->id,
            action: 'bulk_toggle_status',
            modelType: Admin::class,
            description: "Mengubah status {$count} user menjadi {$statusText} (ID: " . implode(', ', $ids) . ")",
            newValues: ['ids' => $ids, 'is_active' => $isActive],
            request: $request
        );

        return response()->json([
            'message' => "{$count} user berhasil diubah statusnya menjadi {$statusText}",
        ]);
    }

    /**
     * Get activity logs for a specific user or all users.
     */
    public function activityLogs(Request $request)
    {
        $query = ActivityLog::with('admin:id,name,email');

        if ($request->filled('admin_id')) {
            $query->where('admin_id', $request->admin_id);
        }

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'data' => $logs->items(),
            'total' => $logs->total(),
            'per_page' => $logs->perPage(),
            'current_page' => $logs->currentPage(),
            'last_page' => $logs->lastPage(),
        ]);
    }

    /**
     * Export users as CSV.
     */
    public function exportCsv(Request $request)
    {
        $query = Admin::query();

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $admins = $query->orderBy('created_at', 'desc')->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="users-export-' . date('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($admins) {
            $file = fopen('php://output', 'w');
            // UTF-8 BOM for Excel compatibility
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($file, ['Nama', 'Email', 'Role', 'Status', 'Terakhir Login', 'Tanggal Dibuat']);

            foreach ($admins as $admin) {
                fputcsv($file, [
                    $admin->name,
                    $admin->email,
                    $admin->role,
                    $admin->is_active ? 'Aktif' : 'Nonaktif',
                    $admin->last_login_at ? $admin->last_login_at->format('Y-m-d H:i:s') : '-',
                    $admin->created_at->format('Y-m-d H:i:s'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Log an activity.
     */
    private function logActivity(
        int $adminId,
        string $action,
        ?string $modelType = null,
        ?int $modelId = null,
        ?string $description = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?Request $request = null
    ) {
        ActivityLog::create([
            'admin_id' => $adminId,
            'action' => $action,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);
    }
}