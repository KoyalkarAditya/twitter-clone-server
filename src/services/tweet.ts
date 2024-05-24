import { prismaClient } from "../clients/db";
import { redisClient } from "../clients/redis";

export interface CreateTweetPayLoad {
  content: string;
  imageURL?: string;
  userId: string;
}

class TweetService {
  public static async createTweet(data: CreateTweetPayLoad) {
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
    return tweet;
  }
  public static async getAllTweets() {
    const cachedTweets = await redisClient.get("ALL_TWEETS");
    if (cachedTweets) {
      console.log(JSON.parse(cachedTweets));
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
