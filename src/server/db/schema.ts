// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import {
	index,
	pgTableCreator,
	serial,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `recipe_vault_${name}`);

export const recipes = createTable("recipes", {
	id: serial("id").primaryKey(),
	link: text("link").notNull(),
	imageUrl: text("imageUrl").notNull(),
	instructions: text("instructions").notNull(),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// export const posts = createTable(
//   "post",
//   {
//     id: serial("id").primaryKey(),
//     name: varchar("name", { length: 256 }),
//     createdAt: timestamp("created_at", { withTimezone: true })
//       .default(sql`CURRENT_TIMESTAMP`)
//       .notNull(),
//     updatedAt: timestamp("updatedAt", { withTimezone: true }),
//   },
//   (example) => ({
//     nameIndex: index("name_idx").on(example.name),
//   })
// );
