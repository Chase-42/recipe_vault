import { NextResponse } from "next/server";

/**
 * Standardized API response format
 * All API routes should use this format for consistency
 */
export type ApiResponse<T = unknown> =
  | {
      success: true;
      data: T;
      error?: never;
    }
  | {
      success: false;
      error: string;
      code?: string;
      data?: never;
    };

/**
 * Paginated API response format
 * For endpoints that return paginated data
 */
export interface PaginatedApiResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalPages: number;
    currentPage: number;
  };
}

/**
 * Helper function to create a successful API response
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    } satisfies ApiResponse<T>,
    { status }
  );
}

/**
 * Helper function to create a paginated API response
 */
export function apiPaginated<T>(
  data: T[],
  pagination: PaginatedApiResponse<T>["pagination"],
  status = 200
): NextResponse<PaginatedApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination,
    } satisfies PaginatedApiResponse<T>,
    { status }
  );
}

/**
 * Helper function to create an error API response
 */
export function apiError(
  error: string,
  code?: string,
  status = 400
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(code && { code }),
    } satisfies ApiResponse<never>,
    { status }
  );
}

/**
 * Type guard to check if an API response is successful
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is Extract<ApiResponse<T>, { success: true }> {
  return response.success === true;
}

/**
 * Type guard to check if an API response is an error
 */
export function isApiError<T>(
  response: ApiResponse<T>
): response is Extract<ApiResponse<T>, { success: false }> {
  return response.success === false;
}
