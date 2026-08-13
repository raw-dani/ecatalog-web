<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StoreSubscriber;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\NewProductNotificationMail;
use App\Models\Product;

class StoreSubscriberController extends Controller
{
    public function subscribe(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:255',
        ]);

        $email = strtolower(trim($request->email));

        $existing = StoreSubscriber::where('email', $email)->first();

        if ($existing) {
            if ($existing->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email ini sudah terdaftar sebagai follower toko.',
                ], 422);
            }

            $existing->update([
                'is_active' => true,
                'token' => Str::random(60),
                'subscribed_at' => now(),
                'unsubscribed_at' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Berhasil mengikuti toko kembali!',
            ]);
        }

        StoreSubscriber::create([
            'email' => $email,
            'token' => Str::random(60),
            'is_active' => true,
            'subscribed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengikuti toko!',
        ]);
    }

    public function unsubscribe(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
        ]);

        $email = strtolower(trim($request->email));
        $token = trim($request->token);

        $subscriber = StoreSubscriber::where('email', $email)
            ->where('token', $token)
            ->where('is_active', true)
            ->first();

        if (!$subscriber) {
            return response()->json([
                'success' => false,
                'message' => 'Link unsubscribe tidak valid atau sudah kadaluarsa.',
            ], 404);
        }

        $subscriber->update([
            'is_active' => false,
            'unsubscribed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil berhenti mengikuti toko.',
        ]);
    }

    public function notifyNewProduct(Product $product)
    {
        if (!$product->is_active) {
            return;
        }

        $subscribers = StoreSubscriber::where('is_active', true)->get();

        if ($subscribers->isEmpty()) {
            return;
        }

        foreach ($subscribers as $subscriber) {
            Mail::to($subscriber->email)->send(new NewProductNotificationMail($product, $subscriber));
        }
    }

    public function index(Request $request)
    {
        $query = StoreSubscriber::query();

        if ($request->filled('status')) {
            $query->where('is_active', $request->boolean('status'));
        }

        $subscribers = $query->orderBy('subscribed_at', 'desc')->paginate(50);

        return response()->json([
            'data' => $subscribers->items(),
            'total' => $subscribers->total(),
        ]);
    }
}
