<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vehicle;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Logowanie pracownika: login + hasło.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login'    => 'required|string',
            'password' => 'required|string',
        ]);
        if ($validator->fails()) {
            return ApiResponse::error('Login i hasło są wymagane');
        }

        $user = User::where('login', $request->input('login'))->first();
        if (!$user) {
            return ApiResponse::error('Nieprawidłowy login lub hasło', 401);
        }

        // Akceptujemy zarówno hashowane (bcrypt) jak i plain-text (zgodność z legacy)
        $isHashed = str_starts_with($user->password, '$');
        $ok = $isHashed
            ? Hash::check($request->input('password'), $user->password)
            : $user->password === $request->input('password');

        if (!$ok) {
            return ApiResponse::error('Nieprawidłowy login lub hasło', 401);
        }

        $request->session()->regenerate();
        $request->session()->put([
            'user_id'    => $user->id,
            'user_role'  => $user->role,
            'user_login' => $user->login,
        ]);

        return ApiResponse::success([
            'user' => $this->presentUser($user),
        ], 'Zalogowano pomyślnie');
    }

    /**
     * Logowanie klienta: nr rejestracyjny + kod dostępu (access_code).
     */
    public function clientLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'plate' => 'required|string',
            'code'  => 'required|string',
        ]);
        if ($validator->fails()) {
            return ApiResponse::error('Numer rejestracyjny i kod dostępu są wymagane');
        }

        $plate = strtoupper(trim($request->input('plate')));
        $code  = strtoupper(trim($request->input('code')));

        $vehicle = Vehicle::with('customer')
            ->whereRaw('UPPER(license_plate) = ?', [$plate])
            ->whereRaw('UPPER(access_code) = ?', [$code])
            ->first();

        if (!$vehicle || !$vehicle->customer) {
            return ApiResponse::error('Nieprawidłowy numer rejestracyjny lub kod dostępu', 401);
        }

        $request->session()->regenerate();
        $request->session()->put([
            'user_id'    => $vehicle->customer->id,
            'user_role'  => 'client',
            'user_login' => $vehicle->license_plate,
            'vehicle_id' => $vehicle->id,
        ]);

        return ApiResponse::success([
            'user' => [
                'id'         => $vehicle->customer->id,
                'login'      => $vehicle->license_plate,
                'role'       => 'client',
                'name'       => $vehicle->customer->full_name,
                'first_name' => $vehicle->customer->first_name,
                'last_name'  => $vehicle->customer->last_name,
                'phone'      => $vehicle->customer->phone,
                'email'      => $vehicle->customer->email,
                'vehicle'    => [
                    'id'    => $vehicle->id,
                    'make'  => $vehicle->make,
                    'model' => $vehicle->model,
                    'plate' => $vehicle->license_plate,
                ],
            ],
        ], 'Zalogowano jako klient');
    }

    /**
     * Wylogowanie.
     */
    public function logout(Request $request)
    {
        $request->session()->flush();
        $request->session()->regenerate();
        return ApiResponse::success([], 'Wylogowano pomyślnie');
    }

    /**
     * Sprawdzenie aktualnej sesji.
     */
    public function check(Request $request)
    {
        if (!$request->session()->has('user_id')) {
            return ApiResponse::error('Brak aktywnej sesji', 401);
        }

        $role = $request->session()->get('user_role');

        if ($role === 'client') {
            $vehicleId = $request->session()->get('vehicle_id');
            $vehicle = Vehicle::with('customer')->find($vehicleId);
            if (!$vehicle || !$vehicle->customer) {
                $request->session()->flush();
                return ApiResponse::error('Sesja wygasła', 401);
            }
            return ApiResponse::success([
                'user' => [
                    'id'         => $vehicle->customer->id,
                    'login'      => $vehicle->license_plate,
                    'role'       => 'client',
                    'name'       => $vehicle->customer->full_name,
                    'first_name' => $vehicle->customer->first_name,
                    'last_name'  => $vehicle->customer->last_name,
                    'phone'      => $vehicle->customer->phone,
                    'email'      => $vehicle->customer->email,
                ],
            ]);
        }

        $user = User::find($request->session()->get('user_id'));
        if (!$user) {
            $request->session()->flush();
            return ApiResponse::error('Użytkownik nie istnieje', 401);
        }

        return ApiResponse::success(['user' => $this->presentUser($user)]);
    }

    /**
     * Edycja profilu (pracownik) — z weryfikacją aktualnego hasła.
     */
    public function updateProfile(Request $request)
    {
        $userId = $request->session()->get('user_id');
        $role   = $request->session()->get('user_role');
        if ($role === 'client') {
            return ApiResponse::error('Klient nie może edytować profilu w tym endpointcie', 403);
        }

        $user = User::find($userId);
        if (!$user) {
            return ApiResponse::error('Użytkownik nie istnieje', 404);
        }

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'login'            => 'nullable|string|max:255',
            'phone'            => 'nullable|regex:/^\d{9}$/',
            'email'            => 'nullable|email|max:255',
            'new_password'     => 'nullable|string|min:3',
        ], [
            'phone.regex'  => 'Numer telefonu musi mieć 9 cyfr',
        ]);
        if ($validator->fails()) {
            return ApiResponse::error($validator->errors()->first(), 422);
        }

        $isHashed = str_starts_with($user->password, '$');
        $ok = $isHashed
            ? Hash::check($request->input('current_password'), $user->password)
            : $user->password === $request->input('current_password');
        if (!$ok) {
            return ApiResponse::error('Złe aktualne hasło', 403);
        }

        // Login musi pozostać unikalny
        $newLogin = $request->input('login') ?: $user->login;
        if ($newLogin !== $user->login) {
            $exists = User::where('login', $newLogin)->where('id', '!=', $user->id)->exists();
            if ($exists) {
                return ApiResponse::error('Login już zajęty');
            }
        }

        $user->fill([
            'login' => $newLogin,
            'phone' => $request->input('phone') ?: $user->phone,
            'email' => $request->input('email') ?: $user->email,
        ]);
        if ($request->filled('new_password')) {
            $user->password = $request->input('new_password'); // cast 'hashed' zrobi resztę
        }
        $user->save();

        $request->session()->put('user_login', $user->login);

        return ApiResponse::success(['user' => $this->presentUser($user)], 'Profil zaktualizowany');
    }

    private function presentUser(User $user): array
    {
        return [
            'id'         => $user->id,
            'login'      => $user->login,
            'role'       => $user->role,
            'name'       => $user->full_name,
            'first_name' => $user->first_name,
            'last_name'  => $user->last_name,
            'phone'      => $user->phone,
            'email'      => $user->email,
        ];
    }
}
