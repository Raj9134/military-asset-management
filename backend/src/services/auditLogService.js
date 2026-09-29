import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ROLES } from "../config/constants.js";

/**
 * Audit log access.
 *
 * Administrators see everything. A base commander sees entries concerning
 * records at their own base, and a logistics officer sees their own actions.
 *
 * The non-admin restriction is expressed as a filter over entity ids that the
 * caller is entitled to see, rather than by fetching a page and hiding rows in
 * JavaScript. That distinction matters: a filter applied after the fact is one
 * forgotten `if` away from leaking another base's activity.
 */

const ENTITIES_WITH_BASE = new Set([
  "Purchase",
  "Assignment",
  "Expenditure",
  "Asset",
  "StockBalance",
]);

async function visibleEntityIds(user) {
  if (user.role === ROLES.ADMIN) return null;

  if (!user.baseId) return [];

  const [purchases, assignments, expenditures, assets] = await Promise.all([
    prisma.purchase.findMany({ where: { baseId: user.baseId }, select: { id: true } }),
    prisma.assignment.findMany({ where: { baseId: user.baseId }, select: { id: true } }),
    prisma.expenditure.findMany({ where: { baseId: user.baseId }, select: { id: true } }),
    prisma.asset.findMany({ where: { currentBaseId: user.baseId }, select: { id: true } }),
  ]);

  return {
    Purchase: purchases.map((row) => String(row.id)),
    Assignment: assignments.map((row) => String(row.id)),
    Expenditure: expenditures.map((row) => String(row.id)),
    Asset: assets.map((row) => String(row.id)),
  };
}

export async function list(filters, user) {
  const where = {};

  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.userId) where.userId = filters.userId;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
    if (filters.dateTo) where.createdAt.lte = filters.dateTo;
  }

  const allowed = await visibleEntityIds(user);

  if (allowed !== null) {
    if (user.role === ROLES.LOGISTICS_OFFICER) {
      // Narrowest scope: their own actions only.
      where.userId = user.id;
    } else if (Array.isArray(allowed)) {
      // A base commander with no base assigned sees nothing.
      where.id = -1;
    } else {
      const or = [];
      for (const [entityType, ids] of Object.entries(allowed)) {
        if (ids.length > 0) {
          or.push({ entityType, entityId: { in: ids } });
        }
      }
      // Transfers and bases are not base-scoped rows, so a commander is shown
      // transfer entries only where they were personally involved.
      or.push({ entityType: "Transfer", userId: user.id });
      or.push({ entityType: "Base" });

      where.OR = or;
    }
  }

  const [total, data] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: {
        id: true,
        userId: true,
        userEmail: true,
        action: true,
        entityType: true,
        entityId: true,
        method: true,
        endpoint: true,
        ipAddress: true,
        userAgent: true,
        statusCode: true,
        requestId: true,
        metadata: true,
        createdAt: true,
      },
    }),
  ]);

  return { total, data };
}

export async function getById(id, user) {
  const entry = await prisma.auditLog.findUnique({ where: { id } });
  if (!entry) throw ApiError.notFound("Audit log entry not found");

  if (user.role !== ROLES.ADMIN) {
    if (user.role === ROLES.LOGISTICS_OFFICER && entry.userId !== user.id) {
      throw ApiError.notFound("Audit log entry not found");
    }
    if (user.role === ROLES.BASE_COMMANDER && entry.userId !== user.id && !ENTITIES_WITH_BASE.has(entry.entityType)) {
      throw ApiError.notFound("Audit log entry not found");
    }
  }

  return entry;
}

/** Distinct actions and entity types, for populating the audit filter controls. */
export async function filterOptions(user) {
  const where = user.role === ROLES.ADMIN ? {} : { userId: user.id };

  const [actions, entityTypes] = await Promise.all([
    prisma.auditLog.findMany({ where, distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
    prisma.auditLog.findMany({ where, distinct: ["entityType"], select: { entityType: true }, orderBy: { entityType: "asc" } }),
  ]);

  return {
    actions: actions.map((row) => row.action),
    entityTypes: entityTypes.map((row) => row.entityType),
  };
}
