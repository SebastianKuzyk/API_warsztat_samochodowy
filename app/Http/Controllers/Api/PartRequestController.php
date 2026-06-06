<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PartRequest;
use App\Models\RepairOrder;
use App\Models\RepairTask;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PartRequestController extends Controller
{
    public function index(Request $request)
    {
        $session = $request->session();
        $query = PartRequest::query()
            ->with(['mechanic:id,first_name,last_name,login', 'part'])
            ->orderByDesc('created_at');

        if ($status = $request->query('status')) {
            if ($status !== 'Wszystkie') $query->where('status', $status);
        } else {
            // Domyślnie ukryj odebrane starsze niż 24h (zostają przez 24h po odbiorze)
            $query->where(function ($q) {
                $q->where('status', '!=', 'Odebrana')
                  ->orWhere('updated_at', '>=', now()->subDay());
            });
        }
        if ($type = $request->query('type')) {
            if ($type === 'W magazynie')   $query->whereNotNull('part_id');
            if ($type === 'Do zamówienia') $query->whereNull('part_id');
        }
        if ($request->boolean('mine')) {
            $query->where('mechanic_id', (int) $session->get('user_id'));
        } elseif ($mechanicId = $request->query('mechanic_id')) {
            $query->where('mechanic_id', (int) $mechanicId);
        }

        $rows = $query->get()->map(fn (PartRequest $r) => [
            'id'                  => $r->id,
            'mechanic_id'         => $r->mechanic_id,
            'repair_task_id'      => $r->repair_task_id,
            'part_id'             => $r->part_id,
            'custom_part_name'    => $r->custom_part_name,
            'quantity'            => $r->quantity,
            'status'              => $r->status,
            'created_at'          => $r->created_at,
            'mechanic_first_name' => $r->mechanic?->first_name,
            'mechanic_last_name'  => $r->mechanic?->last_name,
            'mechanic_login'      => $r->mechanic?->login,
            'part_name'           => $r->display_name,
            'part_price'          => $r->part?->price,
            'part_stock'          => $r->part?->quantity,
            'type'                => $r->type,
        ]);

        return ApiResponse::success($rows);
    }

    public function store(Request $request)
    {
        $role = $request->session()->get('user_role');
        if (!in_array($role, ['mechanic', 'admin'], true)) {
            return ApiResponse::error('Brak uprawnień', 403);
        }

        $data = $request->validate([
            'part_id'           => 'nullable|integer|exists:parts,id',
            'custom_part_name'  => 'nullable|string|max:255',
            'quantity'          => 'integer|min:1',
            'repair_task_id'    => 'nullable|integer|exists:repair_tasks,id',
        ]);
        if (empty($data['part_id']) && empty($data['custom_part_name'])) {
            return ApiResponse::error('Wymagane: part_id albo custom_part_name', 422);
        }

        return DB::transaction(function () use ($request, $data) {
            $mechanicId = (int) $request->session()->get('user_id');

            // Zapobiegaj duplikatom dla tego samego zadania
            if (!empty($data['repair_task_id'])) {
                $exists = PartRequest::where('mechanic_id', $mechanicId)
                    ->where('repair_task_id', $data['repair_task_id'])->exists();
                if ($exists) {
                    return ApiResponse::error('Zgłoszenie dla tego zadania już zostało wysłane', 409);
                }
            }

            $req = PartRequest::create([
                'mechanic_id'      => $mechanicId,
                'repair_task_id'   => $data['repair_task_id']   ?? null,
                'part_id'          => $data['part_id']          ?? null,
                'custom_part_name' => empty($data['part_id']) ? ($data['custom_part_name'] ?? null) : null,
                'quantity'         => $data['quantity'] ?? 1,
                'status'           => 'Brak odpowiedzi',
            ]);

            // Oznacz zadanie jako oczekujące na części + zlecenie -> Czeka na części
            if (!empty($data['repair_task_id'])) {
                $task = RepairTask::find($data['repair_task_id']);
                if ($task) {
                    $task->update(['needs_parts' => true]);
                    RepairOrder::where('id', $task->repair_order_id)->update(['status' => 'Czeka na części']);
                }
            }
            return ApiResponse::success(['id' => $req->id], 'Zgłoszenie wysłane');
        });
    }

    public function update(Request $request, PartRequest $part_request)
    {
        if (!in_array($request->session()->get('user_role'), ['magazynier', 'admin'], true)) {
            return ApiResponse::error('Brak uprawnień', 403);
        }
        $data = $request->validate([
            'status' => 'required|in:Brak odpowiedzi,Zamówiona,Gotowa do odbioru,Odebrana',
        ]);
        $part_request->update($data);
        return ApiResponse::success([], 'Status zaktualizowany');
    }

    /**
     * PUT /api/v1/part-requests/{id}/receive
     * Mechanik potwierdza odbiór części — status = "Odebrana".
     * Po 24h od odbioru zgłoszenie nie jest pokazywane (filtr w index).
     */
    public function markReceived(Request $request, PartRequest $part_request)
    {
        $role = $request->session()->get('user_role');
        // Tylko mechanik właściciel lub admin
        if ($role === 'mechanic' && (int)$part_request->mechanic_id !== (int)$request->session()->get('user_id')) {
            return ApiResponse::error('Brak uprawnień', 403);
        }
        if (!in_array($role, ['mechanic', 'admin', 'magazynier'], true)) {
            return ApiResponse::error('Brak uprawnień', 403);
        }
        $part_request->update(['status' => 'Odebrana']);
        return ApiResponse::success([], 'Część oznaczona jako odebrana');
    }

    public function destroy(PartRequest $part_request)
    {
        $part_request->delete();
        return ApiResponse::success([], 'Zgłoszenie usunięte');
    }

    public function show(PartRequest $part_request)
    {
        return ApiResponse::success($part_request->load(['mechanic', 'part']));
    }
}
