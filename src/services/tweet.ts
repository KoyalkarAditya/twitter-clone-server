import { prismaClient } from "../clients/db";

export interface CreateTweetPayLoad {
  content: string;
  imageURL?: string;
  userId: string;
}

class TweetService {
  public static createTweet(data: CreateTweetPayLoad) {
    return prismaClient.tweet.create({
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
  }
  public static getAllTweets() {
    return prismaClient.tweet.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
export default TweetService;
