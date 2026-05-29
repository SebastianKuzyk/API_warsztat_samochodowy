<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceType;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class ServiceTypeController extends Controller
{
    public function index()
    {
        $services = ServiceType::orderBy('name')->get()->map(fn ($s) => [
            'id'            => $s->id,
            'name'          => $s->name,
            'default_price' => (float) $s->default_price,
            'description'   => $s->description,
        ]);
        return ApiResponse::success($services);
    }

    public function store(Request $request)
    {
        if ($request->session()->get('user_role') !== 'admin') {
            return ApiResponse::error('Brak uprawnień', 403);
        }
        $data = $request->validate([
            'name'          => 'required|string|max:255|unique:service_types,name',
            'default_price' => 'numeric|min:0',
            'description'   => 'nullable|string',
        ]);
        $service = ServiceType::create($data);
        return ApiResponse::success(['id' => $service->id], 'Typ usługi dodany');
    }
}
