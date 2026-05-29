<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Part;
use App\Models\PartRequest;
use App\Models\RepairOrder;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function index(Request $request)
    {
        $session = $request->session();
        $role  = $session->get('user_role');
        $today = now()->toDateString();

        $stats = [];

        if ($role === 'admin') {
            $byStatus = RepairOrder::selectRaw('status, COUNT(*) as cnt')
                ->groupBy('status')
                ->pluck('cnt', 'status');

            $stats['notStarted']    = (int) ($byStatus['Nierozpoczęte']    ?? 0);
            $stats['inProgress']    = (int) ($byStatus['W trakcie']        ?? 0);
            $stats['waitingParts']  = (int) ($byStatus['Czeka na części']  ?? 0);
            $stats['readyToPickup'] = (int) ($byStatus['Gotowe do odbioru']?? 0);
            $stats['pickedUp']      = (int) ($byStatus['Odebrane']         ?? 0);

            $stats['arrivedToday'] = RepairOrder::whereDate('created_at', $today)->count();

            $stats['completedToday'] = RepairOrder::whereDate('completed_at', $today)
                ->whereIn('status', ['Gotowe do odbioru', 'Odebrane'])->count();

            $stats['pickedUpToday'] = RepairOrder::whereDate('completed_at', $today)
                ->where('status', 'Odebrane')->count();

            // Finanse z dzisiejszego dnia
            $orderIds = RepairOrder::whereDate('completed_at', $today)
                ->whereIn('status', ['Gotowe do odbioru', 'Odebrane'])
                ->pluck('id');

            $income = 0;
            $partsCost = 0;
            if ($orderIds->isNotEmpty()) {
                $income = (float) \DB::table('repair_tasks')
                    ->whereIn('repair_order_id', $orderIds)
                    ->sum('price');
                $partsCost = (float) \DB::table('order_parts')
                    ->join('parts', 'order_parts.part_id', '=', 'parts.id')
                    ->whereIn('order_parts.order_id', $orderIds)
                    ->selectRaw('SUM(order_parts.quantity * parts.price) as total')
                    ->value('total') ?? 0;
            }
            $stats['income']    = round($income, 2);
            $stats['partsCost'] = round($partsCost, 2);
            $stats['netProfit'] = round($income - $partsCost, 2);

            $stats['carsInWorkshop'] = [
                'Nierozpoczęte'     => $stats['notStarted'],
                'W trakcie'         => $stats['inProgress'],
                'Czeka na części'   => $stats['waitingParts'],
                'Gotowe do odbioru' => $stats['readyToPickup'],
            ];
        }

        if ($role === 'mechanic') {
            $mid = (int) $session->get('user_id');
            $byStatus = RepairOrder::where('mechanic_id', $mid)
                ->selectRaw('status, COUNT(*) as cnt')
                ->groupBy('status')->pluck('cnt', 'status');

            $stats['notStarted']      = (int) ($byStatus['Nierozpoczęte']     ?? 0);
            $stats['inProgress']      = (int) ($byStatus['W trakcie']         ?? 0);
            $stats['waitingForParts'] = (int) ($byStatus['Czeka na części']   ?? 0);
            $stats['ready']           = (int) ($byStatus['Gotowe do odbioru'] ?? 0);
            $stats['myRequests']      = PartRequest::where('mechanic_id', $mid)->count();
        }

        if ($role === 'recepcja') {
            $byStatus = RepairOrder::selectRaw('status, COUNT(*) as cnt')
                ->groupBy('status')->pluck('cnt', 'status');

            $stats['total']           = (int) $byStatus->sum();
            $stats['notStarted']      = (int) ($byStatus['Nierozpoczęte']     ?? 0);
            $stats['inProgress']      = (int) ($byStatus['W trakcie']         ?? 0);
            $stats['waitingForParts'] = (int) ($byStatus['Czeka na części']   ?? 0);
            $stats['ready']           = (int) ($byStatus['Gotowe do odbioru'] ?? 0);
            $stats['pickedUp']        = (int) ($byStatus['Odebrane']          ?? 0);
        }

        if ($role === 'magazynier') {
            $stats['totalParts']  = Part::count();
            $stats['lowStock']    = Part::where('quantity', '<', 10)->count();
            $stats['newRequests'] = PartRequest::where('status', 'Brak odpowiedzi')->count();
            $stats['readyParts']  = PartRequest::where('status', 'Gotowa do odbioru')->count();
        }

        return ApiResponse::success($stats);
    }
}
