type ResolverMap = Record<string, Record<string, unknown>>;

/** Shallow-merges each top-level type's resolver map (Query, Mutation, User, Post, ...) across modules. */
export const mergeResolvers = (...maps: ResolverMap[]): ResolverMap => {
  const result: ResolverMap = {};

  for (const map of maps) {
    for (const [typeName, fields] of Object.entries(map)) {
      result[typeName] = { ...result[typeName], ...fields };
    }
  }

  return result;
};
