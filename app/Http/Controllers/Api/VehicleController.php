<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index()
    {
        return ApiResponse::success(Vehicle::with('customer')->get());
    }

    public function show(Vehicle $vehicle)
    {
        $vehicle->load('customer', 'repairOrders');
        return ApiResponse::success($vehicle);
    }
}
