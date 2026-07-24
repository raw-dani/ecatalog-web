<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
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

        $token = $admin->createToken('admin-token')->plainTextToken;

        return response()->json([
            'admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
            ],
            'token' => $token,
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'admin' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->role,
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

        // In production, send email with: url('/admin/reset-password?token=' . $token . '&email=' . $admin->email)
        // For development, return token directly
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
            'message' => 'Password berhasil direset. Silakan login dengan password baru.',
        ]);
    }
}
