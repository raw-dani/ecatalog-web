<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SetCacheHeaders
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if ($request->isMethod('GET') && $response->getStatusCode() === 200) {
            $maxAge = 300;

            if ($request->is('api/settings') || $request->is('api/bank-accounts')) {
                $maxAge = 3600;
            } elseif ($request->is('api/categories*') || $request->is('api/products*')) {
                $maxAge = 600;
            } elseif ($request->is('api/orders*') || $request->is('api/cart*')) {
                $maxAge = 0;
            }

            if ($maxAge > 0) {
                $response->headers->set('Cache-Control', "public, max-age={$maxAge}");
                $response->headers->set('Expires', gmdate('D, d M Y H:i:s', time() + $maxAge) . ' GMT');
                $etag = md5($response->getContent());
                $response->headers->set('ETag', $etag);

                if ($request->headers->has('If-None-Match') && $request->headers->get('If-None-Match') === $etag) {
                    return response('', 304);
                }
            } else {
                $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            }
        }

        return $response;
    }
}
