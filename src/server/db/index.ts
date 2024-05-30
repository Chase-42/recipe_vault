import { drizzle } from "drizzle-orm/vercel-postgres";
import * as schema from "./schema";
import { sql } from "@vercel/postgres";

import {
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

// Use this object to send drizzle queries to your DB

export const db = drizzle(sql, { schema });
