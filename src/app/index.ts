import express, { query } from "express";
import { ApolloServer } from "@apollo/server";
import bodyParser from "body-parser";
import { expressMiddleware } from "@apollo/server/express4";
import { User } from "./user";
import { Tweet } from "./tweet";
import cors from "cors";
import { GraphqlContext } from "../interfaces";
import { JWTService } from "../services/jwt";
export async function initServer() {
  const app = express();
  app.use(bodyParser.json());

  const cors = require("cors");
  app.use(
    cors({
      origin:
        "https://twitter-clon-fojdynz42-koyalkar-adityas-projects.vercel.app/",
      methods: "GET,POST",
      allowedHeaders: "Content-Type,Authorization",
    })
  );

  app.get("/", (req, res) => res.status(200).json({ message: "Hello world" }));
  const graphqlServer = new ApolloServer<GraphqlContext>({
    typeDefs: `
    ${User.types}
    ${Tweet.types}

      type Query{
         ${User.queries}
         ${Tweet.queries}
      }
      type Mutation{
        ${Tweet.mutations}
        ${User.mutations}
      }
    `,

    resolvers: {
      Query: {
        ...User.resolvers.queries,
        ...Tweet.resolvers.queries,
      },
      Mutation: {
        ...Tweet.resolvers.mutations,
        ...User.resolvers.mutations,
      },
      ...Tweet.resolvers.extraResolver,
      ...User.resolvers.extraResolver,
    },
  });
  await graphqlServer.start();
  app.use(
    "/graphql",
    expressMiddleware(graphqlServer, {
      context: async ({ req, res }) => {
        return {
          user: req.headers.authorization
            ? JWTService.decodeToken(
                req.headers.authorization.split("Bearer ")[1]
              )
            : undefined,
        };
      },
    })
  );
  return app;
}
