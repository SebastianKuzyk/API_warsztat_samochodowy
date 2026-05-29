<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Part;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class PartController extends Controller
{
    public function index(Request $request)
    {
        $query = Part::query()->orderBy('name');
        if ($search = $request->query('search')) {
            $query->where('name', 'like', "%{$search}%");
        }
        return ApiResponse::success($query->get());
    }

    public function show(Part $part)
    {
        return ApiResponse::success($part);
    }

    public function store(Request $request)
    {
        if (!in_array($request->session()->get('user_role'), ['magazynier', 'admin'], true)) {
            return ApiResponse::error('Brak uprawnień', 403);
        }
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'price'    => 'numeric|min:0',
            'quantity' => 'integer|min:0',
        ]);
        $part = Part::create($data);
        return ApiResponse::success(['id' => $part->id], 'Część dodana');
    }

    public function update(Request $request, Part $part)
    {
        if (!in_array($request->session()->get('user_role'), ['magazynier', 'admin'], true)) {
            return ApiResponse::error('Brak uprawnień', 403);
        }
        $data = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'price'    => 'sometimes|numeric|min:0',
            'quantity' => 'sometimes|integer|min:0',
        ]);
        $part->update($data);
        return ApiResponse::success($part, 'Część zaktualizowana');
    }

    /**
     * PUT /api/v1/parts/{part}/restock
     * Dostawa - zwiększa stan magazynowy.
     */
    public function restock(Request $request, Part $part)
    {
        if (!in_array($request->session()->get('user_role'), ['magazynier', 'admin'], true)) {
            return ApiResponse::error('Brak uprawnień', 403);
        }
        $data = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);
        $part->increment('quantity', $data['quantity']);
        return ApiResponse::success(['quantity' => $part->fresh()->quantity], 'Stan zwiększony');
    }

    public function destroy(Request $request, Part $part)
    {
        if (!in_array($request->session()->get('user_role'), ['magazynier', 'admin'], true)) {
            return ApiResponse::error('Brak uprawnień', 403);
        }
        $part->delete();
        return ApiResponse::success([], 'Część usunięta');
    }
}
