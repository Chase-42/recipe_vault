import "server-only";
import type { NextRequest } from "next/server";
import { generateCorrelationId, logger } from "./logger";

export function getOrSetCorrelationId(req: NextRequest): string {
  const correlationId = req.headers.get("x-correlation-id") ?? generateCorrelationId();
  logger.setCorrelationId(correlationId);
  return correlationId;
}
