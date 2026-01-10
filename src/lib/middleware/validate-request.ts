import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { ValidationError } from "../errors";

export async function validateRequestBody<T extends z.ZodType>(
  req: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body: unknown = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      throw new ValidationError(`Invalid request data: ${message}`);
    }
    throw error;
  }
}

export async function validateRequestParams<T extends z.ZodType>(
  req: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    const { searchParams } = new URL(req.url);
    const params: Record<string, unknown> = {};
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      throw new ValidationError(`Invalid query parameters: ${message}`);
    }
    throw error;
  }
}
