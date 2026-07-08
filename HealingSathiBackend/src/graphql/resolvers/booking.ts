import { GraphQLContext, requireUserId } from "../context";
import * as bookingService from "../../modules/booking/service";
import { prisma } from "../../lib/prisma";

type HealerParent = { id: string; user?: unknown; userId: string };
type UserParent = { id: string };

export const bookingResolvers = {
  Query: {
    healers: (_root: unknown, { specialty }: { specialty?: string | null }) =>
      bookingService.listHealers(specialty),
    healer: (_root: unknown, { id }: { id: string }) => bookingService.getHealerById(id),
    healerAvailableDates: (
      _root: unknown,
      { healerId, from, to }: { healerId: string; from: Date; to: Date },
    ) => bookingService.healerAvailableDates(healerId, from, to),
    healerTimeSlots: (_root: unknown, { healerId, date }: { healerId: string; date: Date }) =>
      bookingService.healerTimeSlots(healerId, date),
    myBookings: (_root: unknown, _args: unknown, ctx: GraphQLContext) =>
      bookingService.myBookings(requireUserId(ctx)),
  },
  Mutation: {
    becomeHealer: (
      _root: unknown,
      { input }: { input: bookingService.BecomeHealerInput },
      ctx: GraphQLContext,
    ) => bookingService.becomeHealer(requireUserId(ctx), input),

    setAvailabilityRules: (
      _root: unknown,
      { rules }: { rules: bookingService.AvailabilityRuleInput[] },
      ctx: GraphQLContext,
    ) => bookingService.setAvailabilityRules(requireUserId(ctx), rules),

    generateSlots: (
      _root: unknown,
      { fromDate, toDate }: { fromDate: Date; toDate: Date },
      ctx: GraphQLContext,
    ) => bookingService.generateSlots(requireUserId(ctx), fromDate, toDate),

    createBooking: (
      _root: unknown,
      { slotId, notes }: { slotId: string; notes?: string | null },
      ctx: GraphQLContext,
    ) => bookingService.createBooking(requireUserId(ctx), slotId, notes),

    cancelBooking: (_root: unknown, { bookingId }: { bookingId: string }, ctx: GraphQLContext) =>
      bookingService.cancelBooking(requireUserId(ctx), bookingId),

    writeReview: (
      _root: unknown,
      { healerId, stars, text }: { healerId: string; stars: number; text: string },
      ctx: GraphQLContext,
    ) => bookingService.writeReview(requireUserId(ctx), healerId, stars, text),
  },
  User: {
    healerProfile: (parent: UserParent) => bookingService.getHealerProfileForUser(parent.id),
  },
  HealerProfile: {
    user: (parent: HealerParent) =>
      parent.user ?? prisma.user.findUniqueOrThrow({ where: { id: parent.userId } }),
    reviews: (parent: HealerParent, args: { first: number; after?: string | null }) =>
      bookingService.listReviews(parent.id, args.first, args.after),
  },
};
