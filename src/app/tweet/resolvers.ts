import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import UserService from "../../services/user";
import { Tweet } from "@prisma/client";
import TweetService, { CreateTweetPayLoad } from "../../services/tweet";

const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
});

const queries = {
  getAllTweets: () => TweetService.getAllTweets(),
  getSignedURLForTweet: async (
    parent: any,
    { imageName, imageType }: { imageName: string; imageType: string },
    context: GraphqlContext
  ) => {
    if (!context.user || !context.user.id) {
      throw new Error("You are not authenticated");
    }
    const allowedImageTypes = ["jpg", "jpeg", "png", "webp", "image/jpeg"];
    if (!allowedImageTypes.includes(imageType)) {
      throw new Error("Image type is not supported");
    }
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `uploads/${
        context.user.id
      }/tweets/${imageName}-${Date.now().toString()}.${imageType}`,
    });
    const signedURL = await getSignedUrl(s3Client, putObjectCommand);
    return signedURL;
  },
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
    const tweet = await TweetService.createTweet({
      ...payload,
      userId: context.user.id,
    });
    return tweet;
  },
};
const extraResolver = {
  Tweet: {
    author: (parent: Tweet) => UserService.getUserById(parent.authorId),
  },
};

export const resolvers = { mutations, extraResolver, queries };
