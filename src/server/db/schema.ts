import {
	pgTableCreator,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `recipe_vault_${name}`);

export const recipes = createTable("recipes", {
	id: serial("id").primaryKey(),
	link: text("link").notNull(),
	name: text("name").notNull(),
	userId: varchar("userId", { length: 256 }).notNull(),
	imageUrl: text("imageUrl").notNull(),
	blurDataUrl: text("blurDataUrl").notNull(),
	instructions: text("instructions").notNull(),
	ingredients: text("ingredients").notNull(),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
});
