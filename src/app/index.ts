import express, { query } from "express";
import { ApolloServer } from "@apollo/server";
import bodyParser from "body-parser";
import { expressMiddleware } from "@apollo/server/express4";
import { User } from "./user";
import cors from "cors";
export async function initServer() {
  const app = express();
  app.use(bodyParser.json());
  app.use(cors());
  const graphqlServer = new ApolloServer<any>({
    typeDefs: `
    ${User.types}

      type Query{
         ${User.queries}
      }
    `,
    resolvers: {
      Query: {
        ...User.resolvers.queries,
      },
    },
  });
  await graphqlServer.start();
  app.use("/graphql", expressMiddleware(graphqlServer));
  return app;
}
