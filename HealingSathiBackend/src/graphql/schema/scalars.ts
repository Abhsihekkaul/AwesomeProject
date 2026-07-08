import { GraphQLScalarType, Kind } from "graphql";

export const scalarsTypeDefs = /* GraphQL */ `
  scalar DateTime
`;

export const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "ISO-8601 date-time string",
  serialize: (value) => (value instanceof Date ? value.toISOString() : value),
  parseValue: (value) => new Date(value as string),
  parseLiteral: (ast) => (ast.kind === Kind.STRING ? new Date(ast.value) : null),
});
