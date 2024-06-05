import { prismaClient } from "../clients/db";
import { redisClient } from "../clients/redis";

export interface CreateTweetPayLoad {
  content: string;
  imageURL?: string;
  userId: string;
}
export interface UpdateTweetPayLoad {
  userId: string;
  tweetId: string;
}
class TweetService {
  public static async createTweet(data: CreateTweetPayLoad) {
    const rateLimitFlag = await redisClient.get(
      `RATE_LIMIT:TWEET${data.userId}`
    );
    if (rateLimitFlag) {
      throw new Error("please wait");
    }

    await redisClient.del("ALL_TWEETS");
    const tweet = await prismaClient.tweet.create({
      data: {
        content: data.content,
        imageURL: data.imageURL,
        author: {
          connect: {
            id: data.userId,
          },
        },
      },
    });
    await redisClient.setex(`RATE_LIMIT:TWEET${data.userId}`, 5, 1);
    return tweet;
  }
  public static async getAllTweets() {
    const cachedTweets = await redisClient.get("ALL_TWEETS");
    if (cachedTweets) {
      return JSON.parse(cachedTweets);
    }
    const allTweets = await prismaClient.tweet.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        likes: {
          include: {
            user: true,
          },
        },
      },
    });
    await redisClient.set("ALL_TWEETS", JSON.stringify(allTweets));
    return allTweets;
  }
  public static async deleteTweet(data: UpdateTweetPayLoad) {
    await redisClient.del("ALL_TWEETS");
    const { userId, tweetId } = data;
    await prismaClient.tweet.delete({
      where: {
        id: tweetId,
      },
    });
  }
  public static async updateLike(data: UpdateTweetPayLoad) {
    await redisClient.del("ALL_TWEETS");
    const { userId, tweetId } = data;
    const userExists = await prismaClient.user.findUnique({
      where: { id: userId },
    });

    const tweetExists = await prismaClient.tweet.findUnique({
      where: { id: tweetId },
    });

    if (!userExists || !tweetExists) {
      throw new Error("User or Tweet does not exist");
    }
    const existingLike = await prismaClient.like.findFirst({
      where: {
        userId,
        tweetId,
      },
    });
    if (existingLike) {
      await prismaClient.like.delete({
        where: {
          userId_tweetId: {
            userId,
            tweetId,
          },
        },
      });
    } else {
      await prismaClient.like.create({
        data: {
          userId,
          tweetId,
        },
      });
    }
  }
  public static async getLikedUsers(tweetId: string) {
    {
      const likes = await prismaClient.like.findMany({
        where: { tweetId },
        include: { user: true },
      });
      return likes.map((like) => like.user);
    }
  }
}

export default TweetService;
