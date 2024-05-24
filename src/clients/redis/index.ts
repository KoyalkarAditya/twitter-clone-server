import Redis from "ioredis";
export const redisClient = new Redis(
  "redis://default:AbRbAAIncDEzYTZlNzU2MTA2Mzk0NjNmYWQ4Y2I3MDc5NDA2ZDczZHAxNDYxNzE@simple-sheepdog-46171.upstash.io:6379",
  {
    tls: {
      rejectUnauthorized: false,
    },
  }
);
