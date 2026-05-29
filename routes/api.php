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
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Warsztat Samochodowy (Laravel 13)
|--------------------------------------------------------------------------
|
| Wszystkie trasy używają sesji (a nie tokenów Sanctum), żeby frontend
| HTML/JS mógł korzystać z `credentials: 'include'` i ciasteczka sesji.
*/

Route::prefix('v1')->middleware(['web'])->group(function () {

    // ----- Autoryzacja -----
    Route::post('auth/login',         [AuthController::class, 'login']);
    Route::post('auth/client-login',  [AuthController::class, 'clientLogin']);
    Route::post('auth/logout',        [AuthController::class, 'logout']);
    Route::get ('auth/check',         [AuthController::class, 'check']);

    // ----- Profil zalogowanego (każda zalogowana rola) -----
    Route::middleware('auth.session')->group(function () {
        Route::put('auth/profile', [AuthController::class, 'updateProfile']);

        // Dashboard / statystyki
        Route::get('stats', [StatsController::class, 'index']);

        // Klient — własny panel (zlecenia, faktury, pojazdy)
        Route::get('client/dashboard', [ClientController::class, 'dashboard']);

        // Słowniki ogólnodostępne
        Route::get('service-types', [ServiceTypeController::class, 'index']);

        // CRUD
        Route::apiResource('users',          UserController::class);
        Route::apiResource('customers',      CustomerController::class);
        Route::apiResource('repair-orders',  RepairOrderController::class);
        Route::apiResource('parts',          PartController::class);
        Route::apiResource('part-requests',  PartRequestController::class);
        Route::apiResource('invoices',       InvoiceController::class);

        // Akcje dodatkowe na zleceniach
        Route::post  ('repair-orders/{repair_order}/tasks',                [RepairOrderController::class, 'addTask']);
        Route::put   ('repair-orders/{repair_order}/tasks',                [RepairOrderController::class, 'updateTasks']);
        Route::put   ('repair-orders/{repair_order}/tasks/edit',           [RepairOrderController::class, 'editTasks']);
        Route::delete('repair-orders/{repair_order}/tasks/{task}',         [RepairOrderController::class, 'deleteTask']);
        Route::post  ('repair-orders/{repair_order}/parts',                [RepairOrderController::class, 'addPart']);
        Route::put   ('repair-orders/{repair_order}/status',               [RepairOrderController::class, 'setStatus']);

        // Akcje na fakturach
        Route::put('invoices/{invoice}/paid', [InvoiceController::class, 'setPaid']);

        // Akcje na częściach
        Route::put('parts/{part}/restock',    [PartController::class, 'restock']);
    });
});
