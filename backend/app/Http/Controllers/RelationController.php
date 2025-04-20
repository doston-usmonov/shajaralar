<?php

namespace App\Http\Controllers;

use App\Models\Person;
use App\Models\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class RelationController extends Controller
{
    /**
     * Display all relations for the authenticated user's people.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $personIds = Person::where('user_id', $userId)->pluck('id');
        
        $relations = Relation::whereIn('parent_id', $personIds)
            ->orWhereIn('child_id', $personIds)
            ->with(['parent', 'child'])
            ->get();
            
        return response()->json($relations);
    }

    /**
     * Store a new relation.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'parent_id' => 'required|exists:people,id',
            'child_id' => 'required|exists:people,id',
            'relation_type' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Ensure both parent and child belong to the authenticated user
        $parent = Person::findOrFail($request->parent_id);
        $child = Person::findOrFail($request->child_id);
        
        if ($parent->user_id !== Auth::id() || $child->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Check if the relation already exists
        $existingRelation = Relation::where('parent_id', $request->parent_id)
            ->where('child_id', $request->child_id)
            ->first();
            
        if ($existingRelation) {
            return response()->json(['message' => 'Relation already exists'], 422);
        }
        
        $relation = Relation::create([
            'parent_id' => $request->parent_id,
            'child_id' => $request->child_id,
            'relation_type' => $request->relation_type ?? 'biological',
        ]);
        
        return response()->json($relation, 201);
    }

    /**
     * Display the specified relation.
     */
    public function show(string $id)
    {
        $relation = Relation::with(['parent', 'child'])->findOrFail($id);
        
        // Ensure the user owns both the parent and child
        $parent = Person::findOrFail($relation->parent_id);
        $child = Person::findOrFail($relation->child_id);
        
        if ($parent->user_id !== Auth::id() || $child->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        return response()->json($relation);
    }

    /**
     * Update the specified relation.
     */
    public function update(Request $request, string $id)
    {
        $relation = Relation::findOrFail($id);
        
        // Ensure the user owns both the parent and child
        $parent = Person::findOrFail($relation->parent_id);
        $child = Person::findOrFail($relation->child_id);
        
        if ($parent->user_id !== Auth::id() || $child->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'relation_type' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $relation->update([
            'relation_type' => $request->relation_type,
        ]);
        
        return response()->json($relation);
    }

    /**
     * Remove the specified relation.
     */
    public function destroy(string $id)
    {
        $relation = Relation::findOrFail($id);
        
        // Ensure the user owns both the parent and child
        $parent = Person::findOrFail($relation->parent_id);
        $child = Person::findOrFail($relation->child_id);
        
        if ($parent->user_id !== Auth::id() || $child->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $relation->delete();
        
        return response()->json(['message' => 'Relation deleted successfully']);
    }

    /**
     * Get all children for a specific person.
     */
    public function getChildren(string $personId)
    {
        $person = Person::findOrFail($personId);
        
        // Ensure the user can only access their own people
        if ($person->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $relations = $person->children()->with('child')->get();
        $children = $relations->map(function ($relation) {
            return $relation->child;
        });
        
        return response()->json($children);
    }

    /**
     * Get all parents for a specific person.
     */
    public function getParents(string $personId)
    {
        $person = Person::findOrFail($personId);
        
        // Ensure the user can only access their own people
        if ($person->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $relations = $person->parents()->with('parent')->get();
        $parents = $relations->map(function ($relation) {
            return $relation->parent;
        });
        
        return response()->json($parents);
    }
}
