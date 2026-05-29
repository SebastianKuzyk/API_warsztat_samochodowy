<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\RepairOrder;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    /**
     * GET /api/v1/client/dashboard
     * Panel klienta — własne pojazdy + zlecenia + faktury.
     */
    public function dashboard(Request $request)
    {
        $session = $request->session();
        if ($session->get('user_role') !== 'client') {
            return ApiResponse::error('Brak uprawnień', 403);
        }

        $customer = Customer::with([
            'vehicles',
            'invoices.order.vehicle:id,make,model,license_plate',
        ])->find($session->get('user_id'));

        if (!$customer) {
            return ApiResponse::error('Klient nie istnieje', 404);
        }

        $vehicleIds = $customer->vehicles->pluck('id');
        $orders = RepairOrder::whereIn('vehicle_id', $vehicleIds)
            ->with(['vehicle:id,make,model,license_plate', 'mechanic:id,first_name,last_name', 'tasks', 'parts'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($o) => [
                'id'                 => $o->id,
                'vehicle_id'         => $o->vehicle_id,
                'status'             => $o->status,
                'created_at'         => $o->created_at,
                'completed_at'       => $o->completed_at,
                'make'               => $o->vehicle?->make,
                'model'              => $o->vehicle?->model,
                'license_plate'      => $o->vehicle?->license_plate,
                'mechanic_first_name'=> $o->mechanic?->first_name,
                'mechanic_last_name' => $o->mechanic?->last_name,
                'tasks'              => $o->tasks,
                'parts'              => $o->parts->map(fn ($p) => [
                    'name'       => $p->name,
                    'quantity'   => (int) $p->pivot->quantity,
                    'part_price' => (float) $p->price,
                    'line_total' => (float) $p->price * (int) $p->pivot->quantity,
                ]),
                'tasks_total' => $o->tasks_total,
                'parts_total' => $o->parts_total,
                'total'       => $o->total,
            ]);

        return ApiResponse::success([
            'customer' => [
                'id'         => $customer->id,
                'first_name' => $customer->first_name,
                'last_name'  => $customer->last_name,
                'phone'      => $customer->phone,
                'email'      => $customer->email,
            ],
            'vehicles' => $customer->vehicles,
            'orders'   => $orders,
            'invoices' => $customer->invoices->map(fn (Invoice $inv) => [
                'id'             => $inv->id,
                'invoice_number' => $inv->invoice_number,
                'document_type'  => $inv->document_type,
                'total'          => (float) $inv->total,
                'paid'           => (bool) $inv->paid,
                'issued_at'      => $inv->issued_at,
                'make'           => $inv->order?->vehicle?->make,
                'model'          => $inv->order?->vehicle?->model,
                'license_plate'  => $inv->order?->vehicle?->license_plate,
            ]),
        ]);
    }
}
