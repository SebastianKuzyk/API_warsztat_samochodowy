<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $session = $request->session();
        $role = $session->get('user_role');
        $roleFilter = $request->query('role');

        // Lista pracowników bez filtra widzi tylko admin.
        // Recepcja/admin może filtrować po roli (np. ?role=mechanic).
        if (!$roleFilter && $role !== 'admin') {
            return ApiResponse::error('Brak uprawnień', 403);
        }

        $query = User::query()->select('id', 'login', 'role', 'first_name', 'last_name', 'phone', 'email', 'created_at');
        if ($roleFilter) {
            $query->where('role', $roleFilter);
        }
        return ApiResponse::success($query->orderBy('id')->get());
    }

    public function show(Request $request, User $user)
    {
        // Klient nie może widzieć danych pracowników
        if ($request->session()->get('user_role') === 'client') {
            return ApiResponse::error('Brak uprawnień', 403);
        }

        $data = $user->only(['id', 'login', 'role', 'first_name', 'last_name', 'phone', 'email', 'created_at']);

        if ($user->role === 'mechanic') {
            $byStatus = $user->repairOrders()
                ->selectRaw('status, COUNT(*) as cnt')
                ->groupBy('status')
                ->pluck('cnt', 'status');
            $data['orders_by_status'] = $byStatus;
            $data['orders_total']     = $byStatus->sum();

            $data['recent_orders'] = $user->repairOrders()
                ->with('vehicle:id,make,model,license_plate')
                ->orderByDesc('created_at')
                ->limit(10)
                ->get(['id', 'vehicle_id', 'status', 'created_at'])
                ->map(fn ($o) => [
                    'id'            => $o->id,
                    'status'        => $o->status,
                    'created_at'    => $o->created_at,
                    'make'          => $o->vehicle?->make,
                    'model'         => $o->vehicle?->model,
                    'license_plate' => $o->vehicle?->license_plate,
                ]);
        }

        return ApiResponse::success($data);
    }

    public function store(Request $request)
    {
        if ($request->session()->get('user_role') !== 'admin') {
            return ApiResponse::error('Brak uprawnień', 403);
        }

        $validator = Validator::make($request->all(), [
            'login'      => 'required|string|max:255|unique:users,login',
            'password'   => 'required|string|min:3',
            'role'       => 'required|in:admin,mechanic,recepcja,magazynier',
            'first_name' => 'nullable|string|max:255',
            'last_name'  => 'nullable|string|max:255',
            'phone'      => 'nullable|regex:/^\d{9}$/',
            'email'      => 'nullable|email|max:255',
        ], [
            'phone.regex' => 'Numer telefonu musi mieć dokładnie 9 cyfr',
        ]);
        if ($validator->fails()) {
            return ApiResponse::error($validator->errors()->first(), 422);
        }

        $user = User::create($validator->validated());
        return ApiResponse::success(['id' => $user->id], 'Użytkownik dodany pomyślnie');
    }

    public function update(Request $request, User $user)
    {
        if ($request->session()->get('user_role') !== 'admin') {
            return ApiResponse::error('Brak uprawnień', 403);
        }
        $data = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'last_name'  => 'nullable|string|max:255',
            'phone'      => 'nullable|regex:/^\d{9}$/',
            'email'      => 'nullable|email|max:255',
        ]);
        $user->update($data);
        return ApiResponse::success([], 'Użytkownik zaktualizowany');
    }

    public function destroy(Request $request, User $user)
    {
        if ($request->session()->get('user_role') !== 'admin') {
            return ApiResponse::error('Brak uprawnień', 403);
        }
        if ($user->id === $request->session()->get('user_id')) {
            return ApiResponse::error('Nie możesz usunąć samego siebie');
        }
        $user->delete();
        return ApiResponse::success([], 'Użytkownik usunięty');
    }
}
