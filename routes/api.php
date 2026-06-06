<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\PartController;
use App\Http\Controllers\Api\PartRequestController;
use App\Http\Controllers\Api\RepairOrderController;
use App\Http\Controllers\Api\ServiceTypeController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VehicleController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['web'])->group(function () {

    // ----- Autoryzacja -----
    Route::post('auth/login',         [AuthController::class, 'login']);
    Route::post('auth/client-login',  [AuthController::class, 'clientLogin']);
    Route::post('auth/logout',        [AuthController::class, 'logout']);
    Route::get ('auth/check',         [AuthController::class, 'check']);

    Route::middleware('auth.session')->group(function () {

        // Profil
        Route::put('auth/profile', [AuthController::class, 'updateProfile']);

        // Statystyki
        Route::get('stats', [StatsController::class, 'index']);

        // Panel klienta
        Route::get('client/dashboard', [ClientController::class, 'dashboard']);

        // Słowniki
        Route::get('service-types', [ServiceTypeController::class, 'index']);

        // CRUD
        Route::apiResource('users',          UserController::class);
        Route::apiResource('customers',      CustomerController::class);
        Route::apiResource('repair-orders',  RepairOrderController::class);
        Route::apiResource('parts',          PartController::class);
        Route::apiResource('part-requests',  PartRequestController::class);
        Route::apiResource('invoices',       InvoiceController::class);

        // Zlecenia — akcje dodatkowe
        Route::post  ('repair-orders/{repair_order}/tasks',       [RepairOrderController::class, 'addTask']);
        Route::put   ('repair-orders/{repair_order}/tasks',       [RepairOrderController::class, 'updateTasks']);
        Route::put   ('repair-orders/{repair_order}/tasks/edit',  [RepairOrderController::class, 'editTasks']);
        Route::delete('repair-orders/{repair_order}/tasks/{task}',[RepairOrderController::class, 'deleteTask']);
        Route::post  ('repair-orders/{repair_order}/parts',       [RepairOrderController::class, 'addPart']);
        Route::put   ('repair-orders/{repair_order}/status',      [RepairOrderController::class, 'setStatus']);

        // Faktury
        Route::put('invoices/{invoice}/paid', [InvoiceController::class, 'setPaid']);

        // Części — dostawa
        Route::put('parts/{part}/restock', [PartController::class, 'restock']);

        // Zgłoszenia — mechanik odbiera część
        Route::put('part-requests/{part_request}/receive', [PartRequestController::class, 'markReceived']);

        // Pojazdy — kody dostępu (admin/recepcja)
        Route::get('vehicles',                                [VehicleController::class, 'index']);
        Route::get('vehicles/{vehicle}',                      [VehicleController::class, 'show']);
        Route::put('vehicles/{vehicle}/regenerate-code',      [VehicleController::class, 'regenerateCode']);
    });
});
