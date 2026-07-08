import { buildApp } from "./app";
import { initSockets } from "./sockets";
import { env } from "./config/env";

const start = async () => {
  const app = buildApp();

  await app.ready();
  initSockets(app.server);

  await app.listen({ port: env.PORT, host: env.HOST });
  app.log.info(`GraphQL playground: http://localhost:${env.PORT}/graphiql`);
  app.log.info(`Socket.io listening on the same port`);
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
