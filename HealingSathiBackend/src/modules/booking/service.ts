import { Prisma, SessionType } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { clampFirst } from "../../lib/pagination";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../utils/errors";
import { notifyUser } from "../notifications/service";

const dayLabel = (date: Date) =>
  `${date.toLocaleDateString("en-US", { weekday: "short" })}\n${date.getDate()}`;

const timeLabel = (date: Date) =>
  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const listHealers = (specialty?: string | null) =>
  prisma.healerProfile.findMany({
    where: { verified: true, ...(specialty ? { specialties: { has: specialty } } : {}) },
    include: { user: true },
    orderBy: { ratingAvg: "desc" },
  });

export const getHealerById = (id: string) =>
  prisma.healerProfile.findUnique({ where: { id }, include: { user: true } });

export const getHealerProfileForUser = (userId: string) =>
  prisma.healerProfile.findUnique({ where: { userId }, include: { user: true } });

export type BecomeHealerInput = {
  title: string;
  bio: string;
  specialties: string[];
  languages: string[];
  sessionTypes: SessionType[];
  priceMin: number;
  priceMax: number;
  currency?: string | null;
};

export const becomeHealer = async (userId: string, input: BecomeHealerInput) => {
  const existing = await prisma.healerProfile.findUnique({ where: { userId } });
  if (existing) throw new ConflictError("You already have a healer profile");

  return prisma.healerProfile.create({
    data: { userId, ...input, currency: input.currency ?? "USD" },
    include: { user: true },
  });
};

export type AvailabilityRuleInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  sessionType: SessionType;
  slotMinutes?: number | null;
};

export const setAvailabilityRules = async (userId: string, rules: AvailabilityRuleInput[]) => {
  const healer = await prisma.healerProfile.findUnique({ where: { userId } });
  if (!healer) throw new ForbiddenError("Only healers can set availability");

  await prisma.$transaction([
    prisma.availabilityRule.deleteMany({ where: { healerId: healer.id } }),
    prisma.availabilityRule.createMany({
      data: rules.map((r) => ({
        healerId: healer.id,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        sessionType: r.sessionType,
        slotMinutes: r.slotMinutes ?? 60,
      })),
    }),
  ]);

  return prisma.healerProfile.findUniqueOrThrow({ where: { id: healer.id }, include: { user: true } });
};

const parseTime = (day: Date, hhmm: string) => {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const d = new Date(day);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

export const generateSlots = async (userId: string, fromDate: Date, toDate: Date) => {
  const healer = await prisma.healerProfile.findUnique({
    where: { userId },
    include: { availabilityRules: { where: { isActive: true } } },
  });
  if (!healer) throw new ForbiddenError("Only healers can generate slots");
  if (fromDate > toDate) throw new ValidationError("fromDate must be before toDate");

  const toCreate: Prisma.SlotCreateManyInput[] = [];

  for (let day = startOfDay(fromDate); day <= toDate; day = addDays(day, 1)) {
    const rulesForDay = healer.availabilityRules.filter((r) => r.dayOfWeek === day.getDay());

    for (const rule of rulesForDay) {
      const dayStart = parseTime(day, rule.startTime);
      const dayEnd = parseTime(day, rule.endTime);

      for (
        let slotStart = dayStart;
        slotStart.getTime() + rule.slotMinutes * 60_000 <= dayEnd.getTime();
        slotStart = new Date(slotStart.getTime() + rule.slotMinutes * 60_000)
      ) {
        toCreate.push({
          healerId: healer.id,
          startAt: slotStart,
          endAt: new Date(slotStart.getTime() + rule.slotMinutes * 60_000),
          sessionType: rule.sessionType,
        });
      }
    }
  }

  if (toCreate.length === 0) return 0;

  const existing = await prisma.slot.findMany({
    where: {
      healerId: healer.id,
      startAt: { in: toCreate.map((s) => s.startAt as Date) },
    },
    select: { startAt: true, sessionType: true },
  });
  const existingKey = new Set(existing.map((s) => `${s.startAt.toISOString()}|${s.sessionType}`));

  const fresh = toCreate.filter((s) => !existingKey.has(`${(s.startAt as Date).toISOString()}|${s.sessionType}`));
  if (fresh.length === 0) return 0;

  const result = await prisma.slot.createMany({ data: fresh });
  return result.count;
};

export const healerAvailableDates = async (healerId: string, from: Date, to: Date) => {
  const slots = await prisma.slot.findMany({
    where: { healerId, status: "Open", startAt: { gte: from, lte: to } },
    select: { startAt: true },
  });

  const openDays = new Set(slots.map((s) => startOfDay(s.startAt).toDateString()));

  const days: { date: Date; label: string; available: boolean }[] = [];
  for (let day = startOfDay(from); day <= to; day = addDays(day, 1)) {
    days.push({ date: day, label: dayLabel(day), available: openDays.has(day.toDateString()) });
  }
  return days;
};

export const healerTimeSlots = async (healerId: string, date: Date) => {
  const dayStart = startOfDay(date);
  const dayEnd = addDays(dayStart, 1);

  const slots = await prisma.slot.findMany({
    where: { healerId, startAt: { gte: dayStart, lt: dayEnd } },
    orderBy: { startAt: "asc" },
  });

  return slots.map((s) => ({
    slotId: s.id,
    startAt: s.startAt,
    label: timeLabel(s.startAt),
    available: s.status === "Open",
  }));
};

export const myBookings = (userId: string) =>
  prisma.booking.findMany({
    where: { patientId: userId },
    include: { slot: true, healer: { include: { user: true } }, patient: true },
    orderBy: { createdAt: "desc" },
  });

export const createBooking = async (patientId: string, slotId: string, notes?: string | null) =>
  prisma.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({ where: { id: slotId }, include: { healer: true } });
    if (!slot) throw new NotFoundError("Slot not found");
    if (slot.status !== "Open") throw new ConflictError("This slot is no longer available");

    await tx.slot.update({ where: { id: slotId }, data: { status: "Booked" } });

    const booking = await tx.booking.create({
      data: {
        slotId,
        patientId,
        healerId: slot.healerId,
        sessionType: slot.sessionType,
        status: "Confirmed",
        notes: notes ?? null,
      },
      include: { slot: true, healer: { include: { user: true } }, patient: true },
    });

    await notifyUser({
      userId: slot.healer.userId,
      type: "Booking",
      title: "New booking",
      message: `${booking.patient.name} booked a ${slot.sessionType.toLowerCase()} session on ${slot.startAt.toLocaleString()}`,
      deepLinkType: "booking",
      deepLinkId: booking.id,
    });

    return booking;
  });

export const cancelBooking = async (userId: string, bookingId: string) =>
  prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { slot: true, healer: true },
    });
    if (!booking) throw new NotFoundError("Booking not found");
    if (booking.patientId !== userId && booking.healer.userId !== userId) {
      throw new ForbiddenError("You are not part of this booking");
    }
    if (booking.status === "Cancelled") return booking;

    await tx.slot.update({ where: { id: booking.slotId }, data: { status: "Open" } });

    return tx.booking.update({
      where: { id: bookingId },
      data: { status: "Cancelled", cancelledAt: new Date() },
      include: { slot: true, healer: { include: { user: true } }, patient: true },
    });
  });

export const writeReview = async (authorId: string, healerId: string, stars: number, text: string) => {
  if (stars < 1 || stars > 5) throw new ValidationError("stars must be between 1 and 5");

  const review = await prisma.review.upsert({
    where: { healerId_authorId: { healerId, authorId } },
    create: { healerId, authorId, stars, text },
    update: { stars, text },
    include: { author: true },
  });

  const agg = await prisma.review.aggregate({ where: { healerId }, _avg: { stars: true }, _count: true });
  await prisma.healerProfile.update({
    where: { id: healerId },
    data: { ratingAvg: agg._avg.stars ?? 0, reviewCount: agg._count },
  });

  return review;
};

export const listReviews = (healerId: string, first: number, after?: string | null) =>
  prisma.review.findMany({
    where: { healerId },
    include: { author: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: clampFirst(first),
    ...(after ? { cursor: { id: after }, skip: 1 } : {}),
  });
