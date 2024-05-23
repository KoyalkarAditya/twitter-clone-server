import { prismaClient } from "../../clients/db";
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
        orderBy: {
          createdAt: "desc",
        },
      }),
    followers: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: {
          follower: {
            id: parent.id,
          },
        },
        include: {
          follower: true,
        },
      });
      return result.map((el) => el.follower);
    },
    following: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: {
          follower: {
            id: parent.id,
          },
        },
        include: {
          following: true,
        },
      });
      return result.map((el) => el.following);
    },
  },
};

const mutations = {
  followUser: async (
    parent: any,
    { to }: { to: string },
    context: GraphqlContext
  ) => {
    if (!context.user || !context.user.id) {
      throw new Error("unauthenticated");
    }
    await UserService.followUser(context.user.id, to);
    return true;
  },
  unfollowUser: async (
    parent: any,
    { to }: { to: string },
    context: GraphqlContext
  ) => {
    if (!context.user || !context.user.id) {
      throw new Error("unauthenticated");
    }
    await UserService.unFollowUser(context.user.id, to);
    return true;
  },
};

export const resolvers = { queries, extraResolver, mutations };
