/**
 * This file has some utility functions to help with error handling that Prisma doesn't provide itself.
 */

import { Prisma } from "@prisma/client";

// An error code that can be thrown by Prisma. View reference at
// https://www.prisma.io/docs/orm/reference/error-reference#error-codes
export type PrismaErrorCode = "P2025";

/**
 * Helper function to check if an exception thrown by Prisma is a PrismaClientKnownRequestError with the specified
 * error code.
 * @param error
 * @param code
 */
export function isPrismaClientKnownRequestError(error: unknown, code: PrismaErrorCode): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}
