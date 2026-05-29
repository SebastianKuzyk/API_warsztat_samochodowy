<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\RepairOrder;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $session = $request->session();
        $role = $session->get('user_role');

        $query = Invoice::query()
            ->with([
                'order.vehicle:id,make,model,license_plate',
                'customer:id,first_name,last_name,phone,email',
                'issuer:id,login',
            ])
            ->orderByDesc('issued_at');

        if ($role === 'client') {
            $query->where('customer_id', (int) $session->get('user_id'));
        }

        return ApiResponse::success(
            $query->get()->map(fn (Invoice $i) => $this->presentList($i))
        );
    }

    public function show(Request $request, Invoice $invoice)
    {
        $session = $request->session();
        if ($session->get('user_role') === 'client'
            && (int) $invoice->customer_id !== (int) $session->get('user_id')) {
            return ApiResponse::error('Brak dostępu', 403);
        }

        $invoice->load([
            'order.vehicle:id,make,model,year,license_plate,vin',
            'order.tasks:id,repair_order_id,description,price',
            'order.parts',
            'order.mechanic:id,first_name,last_name,login',
            'customer',
            'issuer:id,login',
        ]);

        $tasks = $invoice->order?->tasks ?? collect();
        $parts = ($invoice->order?->parts ?? collect())->map(fn ($p) => [
            'name'       => $p->name,
            'quantity'   => (int) $p->pivot->quantity,
            'part_price' => (float) $p->price,
            'line_total' => (float) $p->price * (int) $p->pivot->quantity,
        ]);

        return ApiResponse::success(array_merge(
            $this->presentList($invoice),
            [
                'tasks'                => $tasks,
                'parts'                => $parts,
                'make'                 => $invoice->order?->vehicle?->make,
                'model'                => $invoice->order?->vehicle?->model,
                'year'                 => $invoice->order?->vehicle?->year,
                'license_plate'        => $invoice->order?->vehicle?->license_plate,
                'vin'                  => $invoice->order?->vehicle?->vin,
                'customer_first_name'  => $invoice->customer?->first_name,
                'customer_last_name'   => $invoice->customer?->last_name,
                'customer_phone'       => $invoice->customer?->phone,
                'customer_email'       => $invoice->customer?->email,
                'mechanic_first_name'  => $invoice->order?->mechanic?->first_name,
                'mechanic_last_name'   => $invoice->order?->mechanic?->last_name,
                'issued_by_login'      => $invoice->issuer?->login,
            ]
        ));
    }

    public function store(Request $request)
    {
        if (!in_array($request->session()->get('user_role'), ['recepcja', 'admin'], true)) {
            return ApiResponse::error('Brak uprawnień', 403);
        }

        $data = $request->validate([
            'order_id'        => 'required|integer|exists:repair_orders,id',
            'document_type'   => 'sometimes|in:invoice,receipt',
            'notes'           => 'nullable|string',
            'paid'            => 'sometimes|boolean',
            'seller_name'     => 'nullable|string|max:255',
            'seller_nip'      => 'nullable|string|max:20',
            'seller_address'  => 'nullable|string|max:255',
            'buyer_name'      => 'nullable|string|max:255',
            'buyer_nip'       => 'nullable|string|max:20',
            'buyer_address'   => 'nullable|string|max:255',
            'buyer_city'      => 'nullable|string|max:100',
            'buyer_postcode'  => 'nullable|string|max:10',
            'payment_method'  => 'nullable|string|max:50',
            'due_date'        => 'nullable|date',
        ]);

        $documentType = $data['document_type'] ?? 'invoice';
        if ($documentType === 'invoice' && empty($data['buyer_name'])) {
            return ApiResponse::error('Nazwa nabywcy jest wymagana dla faktury', 422);
        }

        return DB::transaction(function () use ($data, $documentType, $request) {
            $order = RepairOrder::with('vehicle.customer', 'tasks', 'parts')->find($data['order_id']);

            if (Invoice::where('repair_order_id', $order->id)->exists()) {
                return ApiResponse::error('Faktura/paragon dla tego zlecenia już istnieje', 409);
            }

            $tasksTotal = (float) $order->tasks->sum('price');
            $partsTotal = (float) $order->parts->sum(fn ($p) => (float) $p->price * (int) $p->pivot->quantity);
            $total = $tasksTotal + $partsTotal;

            $invoice = Invoice::create([
                'invoice_number'  => Invoice::nextNumber($documentType),
                'repair_order_id' => $order->id,
                'customer_id'     => $order->vehicle?->customer?->id,
                'issued_by'       => (int) $request->session()->get('user_id'),
                'tasks_total'     => $tasksTotal,
                'parts_total'     => $partsTotal,
                'total'           => $total,
                'paid'            => (bool) ($data['paid'] ?? false),
                'notes'           => $data['notes'] ?? null,
                'document_type'   => $documentType,
                'seller_name'     => $data['seller_name']     ?? 'Warsztat Samochodowy Sp. z o.o.',
                'seller_nip'      => $data['seller_nip']      ?? null,
                'seller_address'  => $data['seller_address']  ?? null,
                'buyer_name'      => $data['buyer_name']      ?? null,
                'buyer_nip'       => $data['buyer_nip']       ?? null,
                'buyer_address'   => $data['buyer_address']   ?? null,
                'buyer_city'      => $data['buyer_city']      ?? null,
                'buyer_postcode'  => $data['buyer_postcode']  ?? null,
                'payment_method'  => $data['payment_method']  ?? 'Gotówka',
                'due_date'        => $data['due_date']        ?? null,
                'issued_at'       => now(),
            ]);

            // Wystawienie dokumentu = klient odebrał auto
            $order->update([
                'status'       => 'Odebrane',
                'completed_at' => $order->completed_at ?? now(),
            ]);

            return ApiResponse::success([
                'id'             => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'document_type'  => $invoice->document_type,
                'total'          => (float) $invoice->total,
            ], $documentType === 'receipt' ? 'Paragon wystawiony' : 'Faktura wystawiona');
        });
    }

    public function setPaid(Request $request, Invoice $invoice)
    {
        if (!in_array($request->session()->get('user_role'), ['recepcja', 'admin'], true)) {
            return ApiResponse::error('Brak uprawnień', 403);
        }
        $data = $request->validate(['paid' => 'required|boolean']);
        $invoice->update(['paid' => $data['paid']]);
        return ApiResponse::success([], 'Status płatności zaktualizowany');
    }

    public function update(Request $request, Invoice $invoice)
    {
        return $this->setPaid($request, $invoice);
    }

    public function destroy(Request $request, Invoice $invoice)
    {
        if ($request->session()->get('user_role') !== 'admin') {
            return ApiResponse::error('Brak uprawnień', 403);
        }
        $invoice->delete();
        return ApiResponse::success([], 'Faktura usunięta');
    }

    private function presentList(Invoice $i): array
    {
        return [
            'id'                  => $i->id,
            'invoice_number'      => $i->invoice_number,
            'document_type'       => $i->document_type,
            'repair_order_id'     => $i->repair_order_id,
            'customer_id'         => $i->customer_id,
            'issued_by'           => $i->issued_by,
            'issued_at'           => $i->issued_at,
            'tasks_total'         => (float) $i->tasks_total,
            'parts_total'         => (float) $i->parts_total,
            'total'               => (float) $i->total,
            'paid'                => (bool)  $i->paid,
            'notes'               => $i->notes,
            'seller_name'         => $i->seller_name,
            'seller_nip'          => $i->seller_nip,
            'seller_address'      => $i->seller_address,
            'buyer_name'          => $i->buyer_name,
            'buyer_nip'           => $i->buyer_nip,
            'buyer_address'       => $i->buyer_address,
            'buyer_city'          => $i->buyer_city,
            'buyer_postcode'      => $i->buyer_postcode,
            'payment_method'      => $i->payment_method,
            'due_date'            => $i->due_date,
            'order_id'            => $i->order?->id,
            'order_status'        => $i->order?->status,
            'make'                => $i->order?->vehicle?->make,
            'model'               => $i->order?->vehicle?->model,
            'license_plate'       => $i->order?->vehicle?->license_plate,
            'customer_first_name' => $i->customer?->first_name,
            'customer_last_name'  => $i->customer?->last_name,
            'issued_by_login'     => $i->issuer?->login,
        ];
    }
}
