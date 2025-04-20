<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PersonController;
use App\Http\Controllers\RelationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public API routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});

// Shared (public) tree routes - these don't require authentication
Route::get('/share/{token}/tree', [PersonController::class, 'getSharedTree']);
Route::get('/share/{token}/person', [PersonController::class, 'getSharedPerson']);

// Protected API routes
Route::middleware('auth:sanctum')->group(function () {
    // User routes
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Person routes
    Route::apiResource('/people', PersonController::class);
    Route::get('/people/{id}/tree', [PersonController::class, 'getTree']);
    Route::post('/people/{id}/children', [PersonController::class, 'addChild']); // Yangi tezkor farzand qo'shish yo'li
    Route::put('/people/{id}/toggle-public', [PersonController::class, 'togglePublic']);
    Route::post('/people/{id}/toggle-public', [PersonController::class, 'togglePublic']); // Qo'shimcha POST endpoint
    
    // Relation routes
    Route::apiResource('/relations', RelationController::class);
    Route::get('/people/{id}/children', [RelationController::class, 'getChildren']);
    Route::get('/people/{id}/parents', [RelationController::class, 'getParents']);
});
