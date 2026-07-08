import { prisma } from "../../lib/prisma";

export const getUserById = (userId: string) =>
  prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { conditions: true } });

export const listConditions = () =>
  prisma.condition.findMany({ orderBy: { name: "asc" } });

export type UpdateProfileInput = {
  name?: string;
  bio?: string;
  avatarColor?: string;
  avatarUrl?: string;
  publicProfile?: boolean;
  showConditions?: boolean;
  anonymousPosts?: boolean;
  analyticsOptIn?: boolean;
  researchOptIn?: boolean;
  notifyGroupActivity?: boolean;
  notifyReplies?: boolean;
  notifyMatches?: boolean;
  notifyConsultants?: boolean;
  conditionNames?: string[];
};

export const updateProfile = async (userId: string, input: UpdateProfileInput) => {
  const { conditionNames, ...rest } = input;

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...rest,
      ...(conditionNames
        ? { conditions: { set: conditionNames.map((name) => ({ name })) } }
        : {}),
    },
    include: { conditions: true },
  });
};
