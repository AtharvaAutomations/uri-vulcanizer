import { Recipe, Prisma } from "@prisma/client";

/**
 * Convert various input formats into an ISO-8601 UTC string.
 * Returns null when the value is falsy.
 * Throws an error for an unparseable value.
 */
export function normalizeScheduledAt(value: any): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value.toISOString();
  }

  const str = String(value).trim();

  // if it already looks like a full ISO string (ending in Z)
  if (str.endsWith("Z") && str.length >= 20) {
    return str;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  throw new Error(`Invalid scheduledAt format: ${value}`);
}

/**
 * Remove properties that should never be set/updated by API clients.
 * This keeps the handlers simpler and avoids accidentally overwriting
 * read-only fields coming from the request body.
 */
export function stripReadonlyFields(
  obj: Record<string, any>,
): Record<string, any> {
  const forbidden = [
    "id",
    "machineId",
    "version",
    "parentId",
    "createdAt",
    "activatedAt",
    "finishedAt",
  ];

  return Object.fromEntries(
    Object.entries(obj).filter(([k, _]) => !forbidden.includes(k)),
  );
}

/**
 * Remove keys whose value is undefined or null. Useful when building
 * update objects to avoid accidentally erasing fields.
 */
export function stripUndefined(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null),
  );
}

/**
 * Decide whether an existing recipe requires a new version to be created
 * based on the business rules we currently have.
 */
export function shouldCreateNewVersion(
  old: Recipe,
  updateData: Record<string, any>,
): boolean {
  // editing an already activated or expired recipe always produces a new copy
  if (old.status === "activated" || old.status === "expired") {
    return true;
  }

  // If pending and scheduledAt changed, a new version is required
  if (old.status === "pending" && updateData.scheduledAt) {
    const oldTime = old.scheduledAt?.toISOString();
    const newTime = updateData.scheduledAt;
    return oldTime !== newTime;
  }

  return false;
}

/**
 * Produce the data object that should be used when creating a versioned recipe.
 * The returned object is safe to pass directly to prisma.recipe.create via `data`.
 */
export function makeVersionData(
  old: Recipe,
  updateData: Record<string, any>,
  machineId: string,
): Prisma.RecipeCreateInput {
  const status = updateData.scheduledAt ? "pending" : "draft";
  const nextVersion = old.version + 1;

  // copy all properties except ones that Prisma.createInput doesn't allow or
  // that we want to override
  const { id, createdAt, activatedAt, finishedAt, ...rest } = old as any;

  return {
    ...rest,
    ...updateData,
    machineId,
    version: nextVersion,
    parentId: old.id,
    activatedAt: null,
    finishedAt: null,
    status,
  };
}
