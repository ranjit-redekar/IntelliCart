import type { Role } from "../db/schema.js";

/**
 * Reconciles the two role models that currently disagree in the codebase:
 *   admin/lib/session.tsx   owner | manager | staff
 *   admin/pages/SettingsPage.tsx  owner | admin | manager | support | viewer
 *                                 + 9 named permissions
 *
 * The settings version wins because it is the one with a permission table
 * behind it and the one the UI already renders. The old three map forward:
 *   owner -> owner,  manager -> manager,  staff -> viewer
 */
export const PERMISSIONS = [
  "billing", "members", "roles", "orders", "products",
  "customers", "settings", "ai", "audit",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: ALL,
  admin: ["members", "orders", "products", "customers", "settings", "ai", "audit"],
  manager: ["orders", "products", "customers", "ai"],
  support: ["orders", "customers"],
  viewer: [],
};

export const can = (role: Role, permission: Permission) =>
  ROLE_PERMISSIONS[role].includes(permission);

/** Legacy role names still present in the frontend. */
export const migrateLegacyRole = (r: string): Role =>
  r === "staff" ? "viewer" : (["owner", "admin", "manager", "support", "viewer"].includes(r) ? (r as Role) : "viewer");
