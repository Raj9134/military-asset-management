import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { ROLES } from "../config/constants.js";
import * as audit from "./auditService.js";

/**
 * Equipment types.
 *
 * Like bases, these are never hard deleted. A type that appears in a purchase
 * from six months ago has to stay resolvable for that record to remain readable,
 * so retirement means setting isActive to false.
 *
 * The field that matters here is isTrackable. A trackable type has one Asset row
 * per physical item, with a serial number. A bulk type like ammunition is held
 * as quantity alone. That single boolean is what lets the same movement tables
 * serve vehicles, weapons and rounds without a polymorphic hierarchy.
 */

const buildWhere = ({ includeInactive, category, search }) => {
  const where = {};
  if (!includeInactive) where.isActive = true;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
    ];
  }
  return where;
};

export async function list(filters) {
  const where = buildWhere(filters);
  const [total, data] = await Promise.all([
    prisma.equipmentType.count({ where }),
    prisma.equipmentType.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        unitOfMeasure: true,
        isTrackable: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return { total, data };
}

/**
 * The full catalogue without pagination, for filter dropdowns and select
 * inputs. Kept separate from list so the dropdown does not silently show only
 * the first page of results.
 */
export async function listAll({ includeInactive = false } = {}) {
  return prisma.equipmentType.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      category: true,
      unitOfMeasure: true,
      isTrackable: true,
      isActive: true,
    },
  });
}

export async function getById(id) {
  const item = await prisma.equipmentType.findUnique({
    where: { id },
    include: {
      _count: {
        select: { assets: true, purchases: true, transfers: true, assignments: true, expenditures: true },
      },
    },
  });

  if (!item) {
    throw ApiError.notFound("Equipment type not found");
  }

  return item;
}

export async function create(payload, req) {
  // Codes are the stable identifier used in reports and reference numbers, so a
  // duplicate is a genuine conflict rather than something to silently merge.
  const duplicate = await prisma.equipmentType.findUnique({ where: { code: payload.code } });
  if (duplicate) {
    throw ApiError.conflict(`An equipment type with code ${payload.code} already exists`);
  }

  const item = await prisma.equipmentType.create({
    data: {
      code: payload.code,
      name: payload.name,
      category: payload.category,
      unitOfMeasure: payload.unitOfMeasure,
      isTrackable: payload.isTrackable,
      description: payload.description || null,
      isActive: payload.isActive,
    },
  });

  await audit.record({
    req,
    action: "EQUIPMENT_CREATED",
    entityType: "EquipmentType",
    entityId: item.id,
    metadata: { code: item.code, name: item.name, category: item.category, isTrackable: item.isTrackable },
  });

  return item;
}

export async function update(id, payload, req) {
  const existing = await prisma.equipmentType.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Equipment type not found");
  }

  if (payload.isTrackable !== undefined && payload.isTrackable !== existing.isTrackable) {
    await assertTrackableChangeIsSafe(id);
  }

  // The category and code are not editable. Changing the category would
  // silently reclassify every historical record that references this type.
  if (payload.category && payload.category !== existing.category) {
    throw ApiError.badRequest("Category cannot be changed once an equipment type is in use. Create a new type instead.");
  }

  const item = await prisma.equipmentType.update({
    where: { id },
    data: {
      name: payload.name,
      unitOfMeasure: payload.unitOfMeasure,
      isTrackable: payload.isTrackable,
      description: payload.description === undefined ? undefined : payload.description,
      isActive: payload.isActive,
    },
  });

  await audit.record({
    req,
    action: "EQUIPMENT_UPDATED",
    entityType: "EquipmentType",
    entityId: item.id,
    metadata: { changes: diff(existing, item) },
  });

  return item;
}

/**
 * Flipping isTrackable changes what the existing rows mean. A type that was
 * recorded as bulk quantity would suddenly be expected to have serialised
 * assets, and vice versa. Either change is refused once history exists, so the
 * fix is a new equipment type rather than a reinterpretation of the past.
 */
async function assertTrackableChangeIsSafe(id) {
  const counts = await prisma.equipmentType.findUnique({
    where: { id },
    select: {
      _count: { select: { assets: true, purchases: true, transfers: true, assignments: true, expenditures: true } },
    },
  });

  const hasHistory =
    counts._count.purchases +
      counts._count.transfers +
      counts._count.assignments +
      counts._count.expenditures +
      counts._count.assets >
    0;

  if (hasHistory) {
    throw ApiError.conflict(
      "Trackability cannot be changed once this type has movement history. Create a new equipment type instead."
    );
  }
}

function diff(before, after) {
  const changes = {};
  for (const field of ["name", "category", "unitOfMeasure", "isTrackable", "description", "isActive"]) {
    if (before[field] !== after[field]) {
      changes[field] = { from: before[field], to: after[field] };
    }
  }
  return changes;
}

export async function getUsage(id) {
  const item = await prisma.equipmentType.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          assets: true,
          purchases: true,
          transfers: true,
          assignments: true,
          expenditures: true,
          stockBalances: true,
        },
      },
    },
  });

  if (!item) {
    throw ApiError.notFound("Equipment type not found");
  }

  return item._count;
}

/**
 * Equipment types a base actually holds. Used to populate the equipment filter
 * on the dashboard, so it does not offer a combination that has no history.
 */
export async function listForBase(baseId, user) {
  if (user.role !== ROLES.ADMIN && Number(user.baseId) !== Number(baseId)) {
    throw ApiError.forbidden("You are not authorised to view another base's inventory");
  }

  const balances = await prisma.stockBalance.findMany({
    where: { baseId },
    include: { equipmentType: true },
    orderBy: { equipmentType: { name: "asc" } },
  });

  return balances.map((balance) => ({
    ...balance.equipmentType,
    onHandQuantity: balance.onHandQuantity,
    committedQuantity: balance.committedQuantity,
    available: balance.onHandQuantity - balance.committedQuantity,
  }));
}
