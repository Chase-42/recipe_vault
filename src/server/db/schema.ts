import {
  boolean,
  date,
  index,
  integer,
  pgTableCreator,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `recipe_vault_${name}`);

export const recipes = createTable(
  "recipes",
  {
    id: serial("id").primaryKey(),
    link: text("link").notNull(),
    name: text("name").notNull(),
    userId: varchar("userId", { length: 256 }).notNull(),
    imageUrl: text("imageUrl").notNull(),
    blurDataUrl: text("blurDataUrl").notNull(),
    instructions: text("instructions").notNull(),
    ingredients: text("ingredients").notNull(),
    favorite: boolean("favorite").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    categories: text("categories").array().notNull().default([]),
    tags: text("tags").array().notNull().default([]),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
    favoriteIdx: index("favorite_idx").on(table.favorite),

    // Composite indexes for common query patterns
    userCreatedAtIdx: index("user_created_at_idx").on(
      table.userId,
      table.createdAt
    ),
    userFavoriteIdx: index("user_favorite_idx").on(
      table.userId,
      table.favorite
    ),

    searchIdx: index("search_idx").on(
      table.name,
      table.instructions,
      table.ingredients,
      table.categories,
      table.tags
    ),
    categoriesIdx: index("categories_idx").on(table.categories),
    tagsIdx: index("tags_idx").on(table.tags),
  })
);

// Simple shopping list items table - one list per user
export const shoppingItems = createTable(
  "shopping_items",
  {
    id: serial("id").primaryKey(),
    userId: varchar("userId", { length: 256 }).notNull(),
    name: text("name").notNull(),
    checked: boolean("checked").default(false).notNull(),
    recipeId: serial("recipe_id").references(() => recipes.id, {
      onDelete: "set null",
    }),
    fromMealPlan: boolean("from_meal_plan").default(false).notNull(),
    category: text("category").default("Other").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("shopping_items_user_id_idx").on(table.userId),
    recipeIdIdx: index("shopping_items_recipe_id_idx").on(table.recipeId),
    createdAtIdx: index("shopping_items_created_at_idx").on(table.createdAt),
    userCheckedIdx: index("shopping_items_user_checked_idx").on(
      table.userId,
      table.checked
    ),
    userCreatedAtIdx: index("shopping_items_user_created_at_idx").on(
      table.userId,
      table.createdAt
    ),
    categoryIdx: index("shopping_items_category_idx").on(table.category),
  })
);

// Meal plans table for saving/loading meal plans
export const mealPlans = createTable(
  "meal_plans",
  {
    id: serial("id").primaryKey(),
    userId: varchar("userId", { length: 256 }).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("meal_plans_user_id_idx").on(table.userId),
    createdAtIdx: index("meal_plans_created_at_idx").on(table.createdAt),
    userCreatedAtIdx: index("meal_plans_user_created_at_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);

// Planned meals table for individual meal assignments
export const plannedMeals = createTable(
  "planned_meals",
  {
    id: serial("id").primaryKey(),
    userId: varchar("userId", { length: 256 }).notNull(),
    recipeId: integer("recipeId")
      .references(() => recipes.id, { onDelete: "cascade" })
      .notNull(),
    mealPlanId: integer("mealPlanId").references(() => mealPlans.id, {
      onDelete: "cascade",
    }),
    date: date("date").notNull(),
    mealType: varchar("mealType", { length: 20 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("planned_meals_user_id_idx").on(table.userId),
    recipeIdIdx: index("planned_meals_recipe_id_idx").on(table.recipeId),
    mealPlanIdIdx: index("planned_meals_meal_plan_id_idx").on(table.mealPlanId),
    dateIdx: index("planned_meals_date_idx").on(table.date),
    mealTypeIdx: index("planned_meals_meal_type_idx").on(table.mealType),
    userDateIdx: index("planned_meals_user_date_idx").on(
      table.userId,
      table.date
    ),
    userMealPlanIdx: index("planned_meals_user_meal_plan_idx").on(
      table.userId,
      table.mealPlanId
    ),
    uniqueMealSlotIdx: index("planned_meals_unique_meal_slot_idx").on(
      table.userId,
      table.date,
      table.mealType,
      table.mealPlanId
    ),
  })
);

// Current week planning (separate from saved meal plans)
export const currentWeekMeals = createTable(
  "current_week_meals",
  {
    id: serial("id").primaryKey(),
    userId: varchar("userId", { length: 256 }).notNull(),
    recipeId: integer("recipeId")
      .references(() => recipes.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    mealType: varchar("mealType", { length: 20 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    addedToShoppingList: boolean("addedToShoppingList")
      .default(false)
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("current_week_meals_user_id_idx").on(table.userId),
    recipeIdIdx: index("current_week_meals_recipe_id_idx").on(table.recipeId),
    dateIdx: index("current_week_meals_date_idx").on(table.date),
    mealTypeIdx: index("current_week_meals_meal_type_idx").on(table.mealType),
    userDateIdx: index("current_week_meals_user_date_idx").on(
      table.userId,
      table.date
    ),
    uniqueMealSlotIdx: index("current_week_meals_unique_meal_slot_idx").on(
      table.userId,
      table.date,
      table.mealType
    ),
  })
);
