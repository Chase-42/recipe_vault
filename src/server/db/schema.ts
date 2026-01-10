import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  pgTableCreator,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const createTable = pgTableCreator((name) => `recipe_vault_${name}`);

// ============================================================================
// Auth Tables (Better Auth)
// ============================================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// Auth Relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// ============================================================================
// Recipe Vault Tables
// ============================================================================

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
    // Optimized for getRecipe(id, userId) queries - fastest lookup
    idUserIdIdx: index("id_user_id_idx").on(table.id, table.userId),
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
    recipeId: integer("recipe_id").references(() => recipes.id, {
      onDelete: "cascade",
    }),
    fromMealPlan: boolean("from_meal_plan").default(false).notNull(),
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
