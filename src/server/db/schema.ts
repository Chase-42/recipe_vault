import {
	boolean,
	pgTableCreator,
	serial,
	text,
	timestamp,
	varchar,
	index,
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
	},
	(table) => ({
		userIdIdx: index("user_id_idx").on(table.userId),
		createdAtIdx: index("created_at_idx").on(table.createdAt),
		favoriteIdx: index("favorite_idx").on(table.favorite),
	}),
);
