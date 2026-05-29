<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $clients = Customer::withCount('vehicles')
            ->orderBy('last_name')->orderBy('first_name')
            ->get()
            ->map(function (Customer $c) {
                return [
                    'id'            => $c->id,
                    'first_name'    => $c->first_name,
                    'last_name'     => $c->last_name,
                    'phone'         => $c->phone,
                    'email'         => $c->email,
                    'created_at'    => $c->created_at,
                    'vehicles_count'=> $c->vehicles_count,
                    'vehicles'      => $c->vehicles, // pełna lista dla podglądu
                ];
            });

        return ApiResponse::success($clients);
    }

    public function show(Request $request, Customer $customer)
    {
        $customer->load([
            'vehicles' => function ($q) {
                $q->orderBy('id');
            },
            'vehicles.repairOrders' => function ($q) {
                $q->orderByDesc('created_at')->with(['mechanic:id,first_name,last_name,login', 'tasks', 'parts']);
            },
            'invoices' => function ($q) {
                $q->latest('issued_at');
            },
        ]);

        // Rozwiń dane do struktury, której oczekuje frontend
        $vehicles = $customer->vehicles->map(function ($v) {
            return [
                'id'            => $v->id,
                'make'          => $v->make,
                'model'         => $v->model,
                'year'          => $v->year,
                'license_plate' => $v->license_plate,
                'vin'           => $v->vin,
                'access_code'   => $v->access_code,
                'orders'        => $v->repairOrders->map(function ($o) {
                    return [
                        'id'                  => $o->id,
                        'status'              => $o->status,
                        'created_at'          => $o->created_at,
                        'completed_at'        => $o->completed_at,
                        'mechanic_first_name' => $o->mechanic?->first_name,
                        'mechanic_last_name'  => $o->mechanic?->last_name,
                        'mechanic_login'      => $o->mechanic?->login,
                        'tasks'               => $o->tasks,
                        'parts'               => $o->parts->map(fn ($p) => [
                            'name'       => $p->name,
                            'quantity'   => $p->pivot->quantity,
                            'part_price' => $p->price,
                            'line_total' => (float) $p->price * (int) $p->pivot->quantity,
                        ]),
                        'tasks_total' => $o->tasks_total,
                        'parts_total' => $o->parts_total,
                        'total'       => $o->total,
                    ];
                }),
            ];
        });

        return ApiResponse::success([
            'id'         => $customer->id,
            'first_name' => $customer->first_name,
            'last_name'  => $customer->last_name,
            'phone'      => $customer->phone,
            'email'      => $customer->email,
            'vehicles'   => $vehicles,
            'invoices'   => $customer->invoices,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'phone'      => 'nullable|regex:/^\d{9}$/',
            'email'      => 'nullable|email|max:255',
        ]);
        $customer = Customer::create($data);
        return ApiResponse::success($customer, 'Klient dodany');
    }

    public function update(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'last_name'  => 'nullable|string|max:255',
            'phone'      => 'nullable|regex:/^\d{9}$/',
            'email'      => 'nullable|email|max:255',
        ]);
        $customer->update(array_filter($data));
        return ApiResponse::success($customer, 'Klient zaktualizowany');
    }

    public function destroy(Request $request, Customer $customer)
    {
        if ($request->session()->get('user_role') !== 'admin') {
            return ApiResponse::error('Brak uprawnień', 403);
        }
        $customer->delete();
        return ApiResponse::success([], 'Klient usunięty');
    }
}
