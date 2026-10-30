import type { Role, Status } from "./validators.ts";

// Editors write and submit places; admins also publish, delete, and manage users, states, cities and categories.
// Editors can't change a published place: it would go live without review.
export const canPublish = (role: Role) => role === "admin";
export const canManage = (role: Role) => role === "admin";
export const canEditPlace = (role: Role, status: Status) => role === "admin" || status !== "published";
