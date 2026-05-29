<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Wymusza określoną rolę użytkownika z sesji.
 * Użycie: ->middleware('role:admin,recepcja')
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $sessionRole = $request->session()->get('user_role');

        if (!$sessionRole) {
            return response()->json([
                'success' => false,
                'error'   => 'Brak autoryzacji',
            ], 401);
        }

        if (!in_array($sessionRole, $roles, true)) {
            return response()->json([
                'success' => false,
                'error'   => 'Brak uprawnień do tej operacji',
            ], 403);
        }
        return $next($request);
    }
}
