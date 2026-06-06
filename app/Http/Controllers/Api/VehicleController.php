<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    /**
     * GET /api/v1/vehicles
     * Lista wszystkich pojazdów z access_code (tylko admin/recepcja).
     * ?customer_id=X — pojazdy konkretnego klienta.
     * ?search=XXX    — szukaj po rejestracji lub VIN.
     */
    public function index(Request $request)
    {
        $role = $request->session()->get('user_role');
        if (!in_array($role, ['admin', 'recepcja'], true)) {
            return ApiResponse::error('Brak uprawnień', 403);
        }

        $query = Vehicle::with('customer:id,first_name,last_name,phone,email')
            ->orderBy('license_plate');

        if ($customerId = $request->query('customer_id')) {
            $query->where('customer_id', (int) $customerId);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('license_plate', 'like', "%{$search}%")
                  ->orWhere('vin', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($q2) use ($search) {
                      $q2->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%");
                  });
            });
        }

        return ApiResponse::success($query->get()->map(fn (Vehicle $v) => [
            'id'             => $v->id,
            'customer_id'    => $v->customer_id,
            'make'           => $v->make,
            'model'          => $v->model,
            'year'           => $v->year,
            'license_plate'  => $v->license_plate,
            'vin'            => $v->vin,
            'access_code'    => $v->access_code,
            'customer_name'  => $v->customer
                ? trim(($v->customer->first_name ?? '') . ' ' . ($v->customer->last_name ?? ''))
                : '—',
            'customer_phone' => $v->customer?->phone,
            'created_at'     => $v->created_at,
        ]));
    }

    /**
     * GET /api/v1/vehicles/{vehicle}
     */
    public function show(Request $request, Vehicle $vehicle)
    {
        $role = $request->session()->get('user_role');
        if (!in_array($role, ['admin', 'recepcja'], true)) {
            return ApiResponse::error('Brak uprawnień', 403);
        }

        $vehicle->load('customer');
        return ApiResponse::success([
            'id'             => $vehicle->id,
            'customer_id'    => $vehicle->customer_id,
            'make'           => $vehicle->make,
            'model'          => $vehicle->model,
            'year'           => $vehicle->year,
            'license_plate'  => $vehicle->license_plate,
            'vin'            => $vehicle->vin,
            'access_code'    => $vehicle->access_code,
            'customer_name'  => $vehicle->customer?->full_name,
            'customer_phone' => $vehicle->customer?->phone,
            'customer_email' => $vehicle->customer?->email,
        ]);
    }

    /**
     * PUT /api/v1/vehicles/{vehicle}/regenerate-code
     * Admin/recepcja może wygenerować nowy kod dostępu (np. gdy klient go zgubił).
     */
    public function regenerateCode(Request $request, Vehicle $vehicle)
    {
        $role = $request->session()->get('user_role');
        if (!in_array($role, ['admin', 'recepcja'], true)) {
            return ApiResponse::error('Brak uprawnień', 403);
        }

        $newCode = Vehicle::generateAccessCode();
        $vehicle->update(['access_code' => $newCode]);

        return ApiResponse::success([
            'access_code'   => $newCode,
            'license_plate' => $vehicle->license_plate,
        ], 'Nowy kod dostępu wygenerowany');
    }
}
