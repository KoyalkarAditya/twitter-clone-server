import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
const queries = {
  getAllTweets: () =>
    prismaClient.tweet.findMany({
      orderBy: {
        createdAt: "desc",
      },
    }),
};
const mutations = {
  createTweet: async (
    parent: any,
    { payload }: { payload: CreateTweetPayLoad },
    context: GraphqlContext
  ) => {
    if (!context.user) {
      throw new Error("you are not authenticated");
    }
    const tweet = await prismaClient.tweet.create({
      data: {
        content: payload.content,
        imageURL: payload.imageURL,
        author: {
          connect: {
            id: context.user.id,
          },
        },
      },
    });
    return tweet;
  },
};
const extraResolver = {
  Tweet: {
    author: (parent: any) =>
      prismaClient.user.findUnique({
        where: {
          id: parent.authorId,
        },
      }),
  },
};
interface CreateTweetPayLoad {
  content: string;
  imageURL?: string;
}

export const resolvers = { mutations, extraResolver, queries };
