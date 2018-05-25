const { GraphQLServer } = require('graphql-yoga');

const typeDefs = `
  type Query {
    info: String!
    feed: [Team!]!
  }

  type Team {
    id: ID!
    name: String!
    category: String!
    members: [String!]!
    events: [Event]
    finalScore: Int
  }

  type Event {
    id: ID!
    order: Int!
    time: String
    reps: Int
    weight: Int
    ranking: Int
  }
`;

const resolvers = {
  Query: {
    // missing resolvers
  }
};

const server = new GraphQLServer({
  typeDefs,
  resolvers,
});
server.start(() => console.log(`Server is running on http://localhost:4000`));
