<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteVisit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SiteVisitController extends Controller
{
    /**
     * Mencatat page view dari frontend toko.
     */
    public function track(Request $request)
    {
        $data = $request->validate([
            'path' => 'required|string|max:255',
            'referrer' => 'nullable|string|max:500',
        ]);

        SiteVisit::create([
            'path' => $data['path'],
            'referrer' => $data['referrer'] ?? null,
            'user_agent' => $request->userAgent(),
            'ip' => $request->ip(),
            'session_id' => $request->header('X-Session-ID') ?? ($request->session()->getId() ?? null),
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Statistik traffic untuk dashboard admin.
     */
    public function stats()
    {
        $today = now()->startOfDay();
        $yesterday = now()->subDay()->startOfDay();

        $totalVisits = SiteVisit::count();
        $todayVisits = SiteVisit::where('created_at', '>=', $today)->count();
        $yesterdayVisits = SiteVisit::whereBetween('created_at', [$yesterday, $today])->count();

        // Kunjungan unik hari ini (berdasarkan session/ip)
        $todayUnique = SiteVisit::where('created_at', '>=', $today)
            ->distinct('session_id')->count('session_id');

        // Grafik 14 hari terakhir
        $daily = SiteVisit::where('created_at', '>=', now()->subDays(13)->startOfDay())
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as visits'),
                DB::raw('COUNT(DISTINCT session_id) as unique_visits')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $dailyChart = [];
        for ($i = 13; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $row = $daily->get($date);
            $dailyChart[] = [
                'date' => $date,
                'visits' => (int) ($row->visits ?? 0),
                'unique_visits' => (int) ($row->unique_visits ?? 0),
            ];
        }

        // Halaman terpopuler (30 hari terakhir)
        $topPages = SiteVisit::where('created_at', '>=', now()->subDays(30))
            ->select('path', DB::raw('COUNT(*) as visits'))
            ->groupBy('path')
            ->orderByDesc('visits')
            ->limit(8)
            ->get();

        // Referrer terpopuler (30 hari terakhir)
        $topReferrers = SiteVisit::where('created_at', '>=', now()->subDays(30))
            ->whereNotNull('referrer')
            ->where('referrer', '!=', '')
            ->select('referrer', DB::raw('COUNT(*) as visits'))
            ->groupBy('referrer')
            ->orderByDesc('visits')
            ->limit(5)
            ->get();

        return response()->json([
            'total_visits' => $totalVisits,
            'today_visits' => $todayVisits,
            'yesterday_visits' => $yesterdayVisits,
            'today_unique_visitors' => $todayUnique,
            'daily' => $dailyChart,
            'top_pages' => $topPages,
            'top_referrers' => $topReferrers,
        ]);
    }
}
