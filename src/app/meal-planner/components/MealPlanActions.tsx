"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Save, FolderOpen, Trash2 } from "lucide-react";
import type { MealPlan } from "~/types";

interface MealPlanActionsProps {
  savedPlans: MealPlan[];
  weekStart: Date;
}

// Helper function to format date as YYYY-MM-DD
function formatDateForAPI(date: Date): string {
  const isoString = date.toISOString();
  const datePart = isoString.split("T")[0];
  return datePart ?? isoString.substring(0, 10);
}

// API functions
async function saveMealPlan(
  name: string,
  description: string | undefined,
  weekStart: Date,
): Promise<MealPlan> {
  const response = await fetch("/api/meal-planner/plans", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      description,
      weekStart: formatDateForAPI(weekStart),
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as { error?: string };
    throw new Error(errorData.error ?? "Failed to save meal plan");
  }

  return response.json() as Promise<MealPlan>;
}

async function loadMealPlan(mealPlanId: number): Promise<void> {
  const response = await fetch("/api/meal-planner/plans", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mealPlanId }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as { error?: string };
    throw new Error(errorData.error ?? "Failed to load meal plan");
  }
}

async function deleteMealPlan(mealPlanId: number): Promise<void> {
  const response = await fetch(`/api/meal-planner/plans/${mealPlanId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = (await response.json()) as { error?: string };
    throw new Error(errorData.error ?? "Failed to delete meal plan");
  }
}

export function MealPlanActions({
  savedPlans,
  weekStart,
}: MealPlanActionsProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPlanForDeletion, setSelectedPlanForDeletion] =
    useState<MealPlan | null>(null);

  // Form state for saving meal plans
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");

  const queryClient = useQueryClient();

  // Mutation for saving meal plan
  const saveMutation = useMutation({
    mutationFn: ({
      name,
      description,
    }: {
      name: string;
      description?: string;
    }) => saveMealPlan(name, description, weekStart),
    onSuccess: (savedPlan) => {
      queryClient.invalidateQueries({ queryKey: ["savedMealPlans"] });
      toast.success(`Meal plan "${savedPlan.name}" saved successfully!`);
      setShowSaveDialog(false);
      setPlanName("");
      setPlanDescription("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation for loading meal plan
  const loadMutation = useMutation({
    mutationFn: loadMealPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentWeekMeals"] });
      toast.success("Meal plan loaded successfully!");
      setShowLoadDialog(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation for deleting meal plan
  const deleteMutation = useMutation({
    mutationFn: deleteMealPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedMealPlans"] });
      toast.success("Meal plan deleted successfully!");
      setShowDeleteDialog(false);
      setSelectedPlanForDeletion(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSavePlan = () => {
    if (!planName.trim()) {
      toast.error("Please enter a name for your meal plan");
      return;
    }

    if (planName.trim().length > 100) {
      toast.error("Plan name must be 100 characters or less");
      return;
    }

    if (planDescription && planDescription.length > 500) {
      toast.error("Plan description must be 500 characters or less");
      return;
    }

    saveMutation.mutate({
      name: planName.trim(),
      description: planDescription.trim() || undefined,
    });
  };

  const handleLoadPlan = (planId: number) => {
    loadMutation.mutate(planId);
  };

  const handleDeletePlan = (plan: MealPlan) => {
    setSelectedPlanForDeletion(plan);
    setShowDeleteDialog(true);
  };

  const confirmDeletePlan = () => {
    if (selectedPlanForDeletion) {
      deleteMutation.mutate(selectedPlanForDeletion.id);
    }
  };

  return (
    <>
      <section
        className="bg-gray-800 rounded-lg p-4"
        aria-labelledby="meal-plan-actions-heading"
      >
        <h3
          id="meal-plan-actions-heading"
          className="text-lg font-semibold text-white mb-4"
        >
          Meal Plan Actions
        </h3>
        <div
          className="flex flex-wrap gap-4"
          role="group"
          aria-labelledby="meal-plan-actions-heading"
        >
          <Button
            onClick={() => setShowSaveDialog(true)}
            disabled={saveMutation.isPending}
            className="bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-describedby="save-plan-description"
          >
            <Save className="w-4 h-4 mr-2" aria-hidden="true" />
            Save Current Week as Plan
          </Button>
          <div id="save-plan-description" className="sr-only">
            Save your current week's meal schedule as a reusable meal plan
          </div>

          <Button
            onClick={() => setShowLoadDialog(true)}
            disabled={loadMutation.isPending || savedPlans.length === 0}
            className="bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-describedby="load-plan-description"
          >
            <FolderOpen className="w-4 h-4 mr-2" aria-hidden="true" />
            Load Saved Plan
          </Button>
          <div id="load-plan-description" className="sr-only">
            {savedPlans.length === 0
              ? "No saved meal plans available to load"
              : `Load one of ${savedPlans.length} saved meal plans`}
          </div>
        </div>

        {savedPlans.length > 0 && (
          <div className="mt-4">
            <p
              className="text-gray-400 text-sm"
              role="status"
              aria-live="polite"
            >
              {savedPlans.length} saved meal plan(s) available
            </p>
          </div>
        )}
      </section>

      {/* Save Meal Plan Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Meal Plan</DialogTitle>
            <DialogDescription>
              Save your current week's meal plan to reuse later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="plan-name" className="text-sm font-medium">
                Plan Name *
              </label>
              <Input
                id="plan-name"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="e.g., Healthy Week, Family Favorites"
                maxLength={100}
                disabled={saveMutation.isPending}
              />
              <p className="text-xs text-gray-500">
                {planName.length}/100 characters
              </p>
            </div>
            <div className="grid gap-2">
              <label htmlFor="plan-description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Textarea
                id="plan-description"
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                placeholder="Add notes about this meal plan..."
                maxLength={500}
                disabled={saveMutation.isPending}
                rows={3}
              />
              <p className="text-xs text-gray-500">
                {planDescription.length}/500 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowSaveDialog(false);
                setPlanName("");
                setPlanDescription("");
              }}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSavePlan}
              disabled={saveMutation.isPending || !planName.trim()}
            >
              {saveMutation.isPending ? "Saving..." : "Save Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Meal Plan Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Load Saved Meal Plan</DialogTitle>
            <DialogDescription>
              Select a saved meal plan to load into your current week. This will
              replace any existing meals.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {savedPlans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No saved meal plans found. Save your current week to create your
                first plan!
              </div>
            ) : (
              <div className="space-y-3">
                {savedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {plan.name}
                        </h4>
                        {plan.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {plan.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Created:{" "}
                          {new Date(plan.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleLoadPlan(plan.id)}
                          disabled={loadMutation.isPending}
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePlan(plan)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLoadDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meal Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedPlanForDeletion?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedPlanForDeletion(null);
              }}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePlan}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
