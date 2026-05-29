<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sprawdza, czy w sesji znajduje się zalogowany użytkownik
 * (pracownik LUB klient — zob. AuthController).
 */
class EnsureSessionUser
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->session()->has('user_id')) {
            return response()->json([
                'success' => false,
                'error'   => 'Brak autoryzacji. Zaloguj się ponownie.',
            ], 401);
        }
        return $next($request);
    }
}
