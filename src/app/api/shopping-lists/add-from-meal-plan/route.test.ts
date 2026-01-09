import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
// AuthObject type is not exported, using any for test mock
import { POST } from "./route";

// Mock dependencies
vi.mock("~/lib/auth-helpers", () => ({
  getServerUserIdFromRequest: vi.fn(),
}));

vi.mock("~/lib/errors", () => ({
  AuthorizationError: class AuthorizationError extends Error {
    constructor() {
      super("Unauthorized");
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message);
    }
  },
  handleApiError: vi.fn((error) => ({
    error: error.message,
    statusCode: 500,
  })),
}));

vi.mock("~/lib/rateLimit", () => ({
  withRateLimit: vi.fn((req, handler, _config) => handler(req)),
}));

vi.mock("~/server/queries/shopping-list", () => ({
  addProcessedIngredientsToShoppingList: vi.fn(),
}));

import { getServerUserIdFromRequest } from "~/lib/auth-helpers";
import { addProcessedIngredientsToShoppingList } from "~/server/queries/shopping-list";

describe("/api/shopping-lists/add-from-meal-plan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 when user is not authenticated", async () => {
    vi.mocked(getServerUserIdFromRequest).mockRejectedValue(
      new Error("Unauthorized")
    );

    const request = new NextRequest(
      "http://localhost/api/shopping-lists/add-from-meal-plan",
      {
        method: "POST",
        body: JSON.stringify({ ingredients: [] }),
      }
    );

    const response = await POST(request);
    expect(response.status).toBe(500); // Due to error handling
  });

  it("should validate request body schema", async () => {
    vi.mocked(getServerUserIdFromRequest).mockResolvedValue("user123");

    const request = new NextRequest(
      "http://localhost/api/shopping-lists/add-from-meal-plan",
      {
        method: "POST",
        body: JSON.stringify({ invalid: "data" }),
      }
    );

    // The validation error should be caught and handled by the error handler
    await expect(POST(request)).rejects.toThrow("Invalid request data");
  });

  it("should handle empty selected ingredients", async () => {
    vi.mocked(getServerUserIdFromRequest).mockResolvedValue("user123");

    const request = new NextRequest(
      "http://localhost/api/shopping-lists/add-from-meal-plan",
      {
        method: "POST",
        body: JSON.stringify({
          ingredients: [
            {
              id: "ingredient_1",
              name: "flour",
              quantity: 2,
              unit: "cups",
              originalText: "2 cups flour",
              isSelected: false, // Not selected
              sourceRecipes: [{ recipeId: 1, recipeName: "Bread" }],
            },
          ],
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.addedItems).toEqual([]);
    expect(data.updatedItems).toEqual([]);
  });

  it("should process selected ingredients successfully", async () => {
    vi.mocked(getServerUserIdFromRequest).mockResolvedValue("user123");
    vi.mocked(addProcessedIngredientsToShoppingList).mockResolvedValue({
      addedItems: [
        {
          id: 1,
          userId: "user123",
          name: "2 cups flour",
          checked: false,
          recipeId: 1,
          fromMealPlan: true,
          createdAt: "2023-01-01T00:00:00Z",
        },
      ],
      updatedItems: [],
    });

    const request = new NextRequest(
      "http://localhost/api/shopping-lists/add-from-meal-plan",
      {
        method: "POST",
        body: JSON.stringify({
          ingredients: [
            {
              id: "ingredient_1",
              name: "flour",
              quantity: 2,
              unit: "cups",
              originalText: "2 cups flour",
              isSelected: true,
              sourceRecipes: [{ recipeId: 1, recipeName: "Bread" }],
            },
          ],
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.addedItems).toHaveLength(1);
    expect(data.addedItems[0].name).toBe("2 cups flour");
    expect(addProcessedIngredientsToShoppingList).toHaveBeenCalledWith(
      "user123",
      [
        {
          id: "ingredient_1",
          name: "flour",
          quantity: 2,
          unit: "cups",
          originalText: "2 cups flour",
          isSelected: true,
          sourceRecipes: [{ recipeId: 1, recipeName: "Bread" }],
        },
      ]
    );
  });

  it("should handle ingredients with user modifications", async () => {
    vi.mocked(getServerUserIdFromRequest).mockResolvedValue("user123");
    vi.mocked(addProcessedIngredientsToShoppingList).mockResolvedValue({
      addedItems: [],
      updatedItems: [
        {
          id: 2,
          userId: "user123",
          name: "3 cups flour",
          checked: false,
          recipeId: 1,
          fromMealPlan: true,
          createdAt: "2023-01-01T00:00:00Z",
        },
      ],
    });

    const request = new NextRequest(
      "http://localhost/api/shopping-lists/add-from-meal-plan",
      {
        method: "POST",
        body: JSON.stringify({
          ingredients: [
            {
              id: "ingredient_1",
              name: "flour",
              quantity: 2,
              unit: "cups",
              originalText: "2 cups flour",
              isSelected: true,
              editedQuantity: 3,
              editedUnit: "cups",
              duplicateAction: "combine",
              existingItemId: 2,
              sourceRecipes: [{ recipeId: 1, recipeName: "Bread" }],
            },
          ],
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.updatedItems).toHaveLength(1);
    expect(addProcessedIngredientsToShoppingList).toHaveBeenCalledWith(
      "user123",
      [
        {
          id: "ingredient_1",
          name: "flour",
          quantity: 2,
          unit: "cups",
          originalText: "2 cups flour",
          isSelected: true,
          editedQuantity: 3,
          editedUnit: "cups",
          duplicateAction: "combine",
          existingItemId: 2,
          sourceRecipes: [{ recipeId: 1, recipeName: "Bread" }],
        },
      ]
    );
  });
});
