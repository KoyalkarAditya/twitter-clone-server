import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import { User } from "@prisma/client";
import UserService from "../../services/user";
import { redisClient } from "../../clients/redis";

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
          following: {
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
    recommendedUsers: async (parent: User, {}, context: GraphqlContext) => {
      if (!context.user || !context.user.id) {
        return [];
      }
      const cachedValue = await redisClient.get(
        `RECOMMENDED_USER${context.user.id}`
      );
      if (cachedValue) {
        return JSON.parse(cachedValue);
      }
      const myFollowing = await prismaClient.follows.findMany({
        where: {
          follower: {
            id: context?.user?.id,
          },
        },
        include: {
          following: {
            include: {
              followers: {
                include: {
                  following: true,
                },
              },
            },
          },
        },
      });

      const users: User[] = [];
      for (const followings of myFollowing) {
        for (const followingOfFollowedUser of followings.following.followers) {
          if (
            followingOfFollowedUser.following.id != context?.user?.id &&
            myFollowing.findIndex(
              (e) => e.followingId == followingOfFollowedUser.following.id
            ) < 0
          ) {
            users.push(followingOfFollowedUser.following);
          }
        }
      }
      await redisClient.set(
        `RECOMMENDED_USER${context.user.id}`,
        JSON.stringify(users)
      );
      return users;
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
    await redisClient.del(`RECOMMENDED_USER${context.user.id}`);
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
    await redisClient.del(`RECOMMENDED_USER${context.user.id}`);
    return true;
  },
};

export const resolvers = { queries, extraResolver, mutations };
