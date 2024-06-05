export const types = `#graphql
input createTweetData{
    content : String!
    imageURL : String
}
type Tweet{
    id : ID!
    content : String!
    imageURL : String
    author : User
    likes : [User!]!
}
`;
