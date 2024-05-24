import { prismaClient } from "../clients/db";
import { redisClient } from "../clients/redis";

export interface CreateTweetPayLoad {
  content: string;
  imageURL?: string;
  userId: string;
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
    });
    await redisClient.set("ALL_TWEETS", JSON.stringify(allTweets));
    return allTweets;
  }
}
export default TweetService;
