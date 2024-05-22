import axios from "axios";
import { prismaClient } from "../../clients/db";
import { JWTService } from "../../services/jwt";
import { GraphqlContext } from "../../interfaces";
import { User } from "@prisma/client";
import UserService from "../../services/user";

const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const userToken = await UserService.verifyGoogleAuthToken(token);
    return userToken;
  },
  getCurrentUser: async (parent: any, args: any, context: GraphqlContext) => {
    const id = context.user?.id;
    if (!id) {
      return null;
    }
    const user = await UserService.getUserById(id);
    return user;
  },
  getUserById: async (
    parent: any,
    { id }: { id: string },
    context: GraphqlContext
  ) => {
    const user = await UserService.getUserById(id);
    return user;
  },
};
const extraResolver = {
  User: {
    tweets: (parent: User) =>
      prismaClient.tweet.findMany({
        where: {
          authorId: parent.id,
        },
      }),
  },
};
export const resolvers = { queries, extraResolver };
