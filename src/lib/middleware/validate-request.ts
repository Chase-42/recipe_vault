import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { ValidationError } from "../errors";

function throwValidationError(error: unknown, prefix: string): never {
  if (error instanceof z.ZodError) {
    const message = error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new ValidationError(`${prefix}: ${message}`);
  }
  throw error as Error;
}

export async function validateRequestBody<T extends z.ZodType>(
  req: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body: unknown = await req.json();
    return schema.parse(body);
  } catch (error) {
    throwValidationError(error, "Invalid request data");
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
    throwValidationError(error, "Invalid query parameters");
  }
}
