<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $admin = Admin::where('email', $request->email)->first();

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Update last login timestamp
        $admin->update(['last_login_at' => now()]);

        $token = $admin->createToken('admin-token')->plainTextToken;

        return response()->json([
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
                'roles' => $admin->roles->pluck('name'),
            ],
            'token' => $token,
        ]);
    }

    public function me(Request $request)
    {
        $admin = $request->user()->load('roles');

        return response()->json([
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
                'avatar' => $admin->avatar,
                'roles' => $admin->roles->pluck('name'),
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:admins,email',
        ]);

        $admin = Admin::where('email', $request->email)->first();

        if ($admin->role === 'demo') {
            return response()->json(['message' => 'Reset password tidak diizinkan untuk akun demo.'], 403);
        }

        // Delete old tokens
        DB::table('password_reset_tokens')
            ->where('email', $admin->email)
            ->where('guard', 'admin')
            ->delete();

        // Generate token (valid 60 minutes)
        $token = Str::random(64);
        DB::table('password_reset_tokens')->insert([
            'email' => $admin->email,
            'token' => Hash::make($token),
            'guard' => 'admin',
            'expires_at' => now()->addMinutes(60),
            'created_at' => now(),
        ]);

        $resetUrl = url('/auth/reset-password?token=' . $token . '&email=' . urlencode($admin->email));

        return response()->json([
            'message' => 'Link reset password telah dikirim ke email Anda',
            'reset_url' => $resetUrl,
            'token' => $token, // Only for development; remove in production
            'email' => $admin->email,
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:admins,email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('guard', 'admin')
            ->first();

        $admin = Admin::where('email', $request->email)->first();
        if ($admin && $admin->role === 'demo') {
            return response()->json(['message' => 'Reset password tidak diizinkan untuk akun demo.'], 403);
        }

        if (!$record) {
            throw ValidationException::withMessages([
                'email' => ['Token reset password tidak valid.'],
            ]);
        }

        if ($record->expires_at && now()->isAfter($record->expires_at)) {
            DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->where('guard', 'admin')
                ->delete();
            throw ValidationException::withMessages([
                'email' => ['Token reset password sudah kadaluarsa.'],
            ]);
        }

        if (!Hash::check($request->token, $record->token)) {
            throw ValidationException::withMessages([
                'email' => ['Token reset password tidak valid.'],
            ]);
        }

        // Update password
        $admin = Admin::where('email', $request->email)->first();
        $admin->update([
            'password' => Hash::make($request->password),
        ]);

        // Delete used token
        DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('guard', 'admin')
            ->delete();

        // Revoke all existing tokens for this admin
        $admin->tokens()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function updateProfile(Request $request)
    {
        $admin = $request->user();

        $rules = [];
        if ($request->has('name') || $request->has('email')) {
            $rules['name'] = 'required|string|max:255';
            $rules['email'] = 'required|email|max:255|unique:admins,email,' . $admin->id;
        }
        $rules['avatar'] = 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048';

        $request->validate($rules);

        $data = [];
        if ($request->has('name')) {
            $data['name'] = $request->name;
        }
        if ($request->has('email')) {
            $data['email'] = $request->email;
        }

        if ($request->hasFile('avatar')) {
            if ($admin->avatar) {
                Storage::disk('public')->delete($admin->avatar);
            }
            $path = $request->file('avatar')->store('avatars', 'public');
            $data['avatar'] = $path;
        }

        $admin->update($data);

        $admin->load('roles');

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
                'avatar' => $admin->avatar,
                'roles' => $admin->roles->pluck('name'),
            ],
        ]);
    }

    public function changePassword(Request $request)
    {
        $admin = $request->user();

        if ($admin->role === 'demo') {
            return response()->json(['message' => 'Ganti password tidak diizinkan untuk akun demo.'], 403);
        }

        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($request->current_password, $admin->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Password saat ini tidak sesuai.'],
            ]);
        }

        $admin->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'message' => 'Password berhasil diubah',
        ]);
    }
}