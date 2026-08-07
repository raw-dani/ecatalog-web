<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     * Usage: role:super_admin,admin or role:manager or role:karyawan
     *
     * Check is performed against BOTH:
     *  1. The single 'role' column (e.g. $admin->role === 'manager')
     *  2. The many-to-many pivot roles table (role_admin)
     *
     * This ensures demo users, who are assigned ALL roles in the pivot table,
     * can access the same resources as super_admin.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $admin = $request->user();

        if (!$admin) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Check via the single 'role' column
        if (in_array($admin->role, $roles)) {
            return $next($request);
        }

        // Check via the many-to-many pivot roles table
        $pivotRoles = $admin->roles()->pluck('name')->toArray();
        if (array_intersect($roles, $pivotRoles)) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Forbidden. You do not have the required role to access this resource.',
        ], 403);
    }
}