<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Part;
use App\Models\RepairOrder;
use App\Models\RepairTask;
use App\Models\Vehicle;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RepairOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = RepairOrder::query()
            ->with([
                'vehicle.customer',
                'mechanic:id,first_name,last_name,login',
                'tasks',
                'parts',
            ])
            ->orderByDesc('created_at');

        if ($request->filled('status') && $request->query('status') !== 'Wszystkie') {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('mechanic_id')) {
            $query->where('mechanic_id', (int) $request->query('mechanic_id'));
        }

        return ApiResponse::success(
            $query->get()->map(fn (RepairOrder $o) => $this->presentList($o))
        );
    }

    public function show(Request $request, RepairOrder $repair_order)
    {
        $repair_order->load(['vehicle.customer', 'mechanic', 'tasks', 'parts']);
        return ApiResponse::success($this->presentFull($repair_order));
    }

    public function store(Request $request)
    {
        if (!in_array($request->session()->get('user_role'), ['recepcja', 'admin'], true)) {
            return ApiResponse::error('Brak uprawnień', 403);
        }

        $validator = Validator::make($request->all(), [
            'customer.firstName' => 'required|string|max:255',
            'customer.lastName'  => 'required|string|max:255',
            'customer.phone'     => 'nullable|string|max:20',
            'customer.email'     => 'nullable|email|max:255',
            'vehicle.make'       => 'required|string|max:255',
            'vehicle.model'      => 'required|string|max:255',
            'vehicle.year'       => 'nullable|integer|min:1900|max:2100',
            'vehicle.plate'      => 'required|string|max:20',
            'vehicle.vin'        => 'nullable|string|max:17',
            'mechanicId'         => 'required|integer|exists:users,id',
            'tasks'              => 'required|array|min:1',
            'tasks.*.description' => 'required|string',
            'tasks.*.price'      => 'required|numeric|min:0',
            'tasks.*.service_type_id' => 'nullable|integer|exists:service_types,id',
        ]);
        if ($validator->fails()) {
            return ApiResponse::error($validator->errors()->first(), 422);
        }
        $data = $validator->validated();

        return DB::transaction(function () use ($data) {
            // Klient
            $customer = Customer::firstOrCreate(
                [
                    'first_name' => $data['customer']['firstName'],
                    'last_name'  => $data['customer']['lastName'],
                ],
                [
                    'phone' => $data['customer']['phone']  ?? null,
                    'email' => $data['customer']['email']  ?? null,
                ]
            );

            // Pojazd (po VIN albo rejestracji, inaczej utwórz)
            $vehicle = null;
            if (!empty($data['vehicle']['vin'])) {
                $vehicle = Vehicle::where('vin', $data['vehicle']['vin'])->first();
            }
            if (!$vehicle) {
                $vehicle = Vehicle::where('license_plate', $data['vehicle']['plate'])->first();
            }
            if (!$vehicle) {
                $vehicle = Vehicle::create([
                    'customer_id'   => $customer->id,
                    'make'          => $data['vehicle']['make'],
                    'model'         => $data['vehicle']['model'],
                    'year'          => $data['vehicle']['year'] ?? null,
                    'license_plate' => $data['vehicle']['plate'],
                    'vin'           => $data['vehicle']['vin'] ?? null,
                    'access_code'   => Vehicle::generateAccessCode(),
                ]);
            } elseif (!$vehicle->access_code) {
                $vehicle->access_code = Vehicle::generateAccessCode();
                $vehicle->save();
            }

            $order = RepairOrder::create([
                'vehicle_id'  => $vehicle->id,
                'mechanic_id' => $data['mechanicId'],
                'status'      => 'Nierozpoczęte',
                'description' => '',
            ]);

            foreach ($data['tasks'] as $t) {
                RepairTask::create([
                    'repair_order_id' => $order->id,
                    'service_type_id' => $t['service_type_id'] ?? null,
                    'description'     => $t['description'],
                    'price'           => $t['price'],
                ]);
            }

            return ApiResponse::success([
                'id'          => $order->id,
                'access_code' => $vehicle->access_code,
                'plate'       => $vehicle->license_plate,
            ], 'Zlecenie dodane pomyślnie');
        });
    }

    public function destroy(Request $request, RepairOrder $repair_order)
    {
        if (!in_array($request->session()->get('user_role'), ['recepcja', 'admin'], true)) {
            return ApiResponse::error('Brak uprawnień', 403);
        }
        $repair_order->delete();
        return ApiResponse::success([], 'Zlecenie usunięte');
    }

    public function update(Request $request, RepairOrder $repair_order)
    {
        return $this->setStatus($request, $repair_order);
    }

    /**
     * PUT /api/v1/repair-orders/{order}/status
     */
    public function setStatus(Request $request, RepairOrder $repair_order)
    {
        $data = $request->validate([
            'status' => 'required|in:' . implode(',', RepairOrder::STATUSES),
        ]);

        $repair_order->status = $data['status'];
        if (in_array($data['status'], ['Gotowe do odbioru', 'Odebrane'], true)) {
            $repair_order->completed_at = $repair_order->completed_at ?? now();
        }
        $repair_order->save();

        return ApiResponse::success([], 'Status zaktualizowany');
    }

    /**
     * PUT /api/v1/repair-orders/{order}/tasks
     * Aktualizacja zadań przez mechanika (is_completed, needs_parts).
     */
    public function updateTasks(Request $request, RepairOrder $repair_order)
    {
        $data = $request->validate([
            'tasks'                => 'required|array',
            'tasks.*.id'           => 'required|integer|exists:repair_tasks,id',
            'tasks.*.is_completed' => 'sometimes|boolean',
            'tasks.*.needs_parts'  => 'sometimes|boolean',
        ]);

        $orderId = (int) $repair_order->id;
        $updated = 0;

        DB::transaction(function () use ($data, $orderId, &$updated) {
            foreach ($data['tasks'] as $t) {
                $taskId = (int) $t['id'];
                $isCompleted = isset($t['is_completed']) ? (int)(bool)$t['is_completed'] : 0;
                $needsParts  = isset($t['needs_parts'])  ? (int)(bool)$t['needs_parts']  : 0;

                $rows = DB::table('repair_tasks')
                    ->where('id', $taskId)
                    ->where('repair_order_id', $orderId)
                    ->update([
                        'is_completed' => $isCompleted,
                        'needs_parts'  => $needsParts,
                        'updated_at'   => now(),
                    ]);
                $updated += $rows;
            }
        });

        // Wyczyść cache relacji i załaduj świeże dane z bazy
        $repair_order->unsetRelation('tasks');
        $repair_order->refresh();
        $repair_order->load('tasks');

        $newStatus = $repair_order->recalculateStatus();
        return ApiResponse::success([
            'status'   => $newStatus,
            'updated'  => $updated,
            'order_id' => $orderId,
        ], 'Zadania zaktualizowane');
    }

    /**
     * PUT /api/v1/repair-orders/{order}/tasks/edit
     * Edycja opisu/ceny zadań (recepcja/admin).
     */
    public function editTasks(Request $request, RepairOrder $repair_order)
    {
        if (!in_array($request->session()->get('user_role'), ['recepcja', 'admin'], true)) {
            return ApiResponse::error('Brak uprawnień', 403);
        }

        $data = $request->validate([
            'tasks'              => 'required|array',
            'tasks.*.id'         => 'required|integer|exists:repair_tasks,id',
            'tasks.*.description' => 'sometimes|string',
            'tasks.*.price'      => 'sometimes|numeric|min:0',
        ]);

        DB::transaction(function () use ($data, $repair_order) {
            foreach ($data['tasks'] as $t) {
                $update = [];
                if (isset($t['description'])) $update['description'] = $t['description'];
                if (isset($t['price']))       $update['price']       = $t['price'];
                if ($update) {
                    RepairTask::where('id', $t['id'])
                        ->where('repair_order_id', $repair_order->id)
                        ->update($update);
                }
            }
        });

        return ApiResponse::success([], 'Zadania zaktualizowane');
    }

    /**
     * POST /api/v1/repair-orders/{order}/tasks
     * Dodaj custom zadanie do istniejącego zlecenia.
     */
    public function addTask(Request $request, RepairOrder $repair_order)
    {
        if (!in_array($request->session()->get('user_role'), ['recepcja', 'admin'], true)) {
            return ApiResponse::error('Brak uprawnień', 403);
        }

        $data = $request->validate([
            'description'     => 'required|string',
            'price'           => 'required|numeric|min:0',
            'service_type_id' => 'nullable|integer|exists:service_types,id',
        ]);

        $task = RepairTask::create([
            'repair_order_id' => $repair_order->id,
            'description'     => $data['description'],
            'price'           => $data['price'],
            'service_type_id' => $data['service_type_id'] ?? null,
        ]);

        return ApiResponse::success(['id' => $task->id], 'Zadanie dodane');
    }

    /**
     * DELETE /api/v1/repair-orders/{order}/tasks/{task}
     */
    public function deleteTask(Request $request, RepairOrder $repair_order, RepairTask $task)
    {
        if (!in_array($request->session()->get('user_role'), ['recepcja', 'admin'], true)) {
            return ApiResponse::error('Brak uprawnień', 403);
        }
        if ($task->repair_order_id !== $repair_order->id) {
            return ApiResponse::error('Zadanie nie należy do tego zlecenia', 404);
        }
        $task->delete();
        return ApiResponse::success([], 'Zadanie usunięte');
    }

    /**
     * POST /api/v1/repair-orders/{order}/parts
     * Mechanik dodaje część z magazynu do zlecenia.
     */
    public function addPart(Request $request, RepairOrder $repair_order)
    {
        $data = $request->validate([
            'part_id'  => 'required|integer|exists:parts,id',
            'quantity' => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($data, $repair_order) {
            $part = Part::lockForUpdate()->find($data['part_id']);
            if ($part->quantity < $data['quantity']) {
                return ApiResponse::error('Niewystarczająca ilość w magazynie. Dostępne: ' . $part->quantity);
            }

            $existing = $repair_order->parts()->where('part_id', $part->id)->first();
            if ($existing) {
                $repair_order->parts()->updateExistingPivot($part->id, [
                    'quantity' => $existing->pivot->quantity + $data['quantity'],
                ]);
            } else {
                $repair_order->parts()->attach($part->id, ['quantity' => $data['quantity']]);
            }

            $part->decrement('quantity', $data['quantity']);

            return ApiResponse::success([], "Dodano {$data['quantity']} szt. do zlecenia");
        });
    }

    /* ----------------- Helpers ----------------- */

    private function presentList(RepairOrder $o): array
    {
        return [
            'id'                   => $o->id,
            'vehicle_id'           => $o->vehicle_id,
            'mechanic_id'          => $o->mechanic_id,
            'status'               => $o->status,
            'description'          => $o->description,
            'service_price'        => (float) $o->service_price,
            'completed_at'         => $o->completed_at,
            'created_at'           => $o->created_at,
            'make'                 => $o->vehicle?->make,
            'model'                => $o->vehicle?->model,
            'year'                 => $o->vehicle?->year,
            'license_plate'        => $o->vehicle?->license_plate,
            'vin'                  => $o->vehicle?->vin,
            'customer_id'          => $o->vehicle?->customer?->id,
            'customer_first_name'  => $o->vehicle?->customer?->first_name,
            'customer_last_name'   => $o->vehicle?->customer?->last_name,
            'customer_phone'       => $o->vehicle?->customer?->phone,
            'customer_email'       => $o->vehicle?->customer?->email,
            'mechanic_first_name'  => $o->mechanic?->first_name,
            'mechanic_last_name'   => $o->mechanic?->last_name,
            'tasks'                => $o->tasks,
            'parts'                => $o->parts->map(fn ($p) => [
                'part_id'    => $p->id,
                'name'       => $p->name,
                'quantity'   => (int) $p->pivot->quantity,
                'part_price' => (float) $p->price,
                'line_total' => (float) $p->price * (int) $p->pivot->quantity,
            ]),
            'tasks_total' => $o->tasks_total,
            'parts_total' => $o->parts_total,
            'total'       => $o->total,
        ];
    }

    private function presentFull(RepairOrder $o): array
    {
        return $this->presentList($o);
    }
}
