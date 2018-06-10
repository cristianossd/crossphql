const { GraphQLServer } = require('graphql-yoga');
const { Prisma } = require('prisma-binding');

const Query = require('./resolvers/Query');
const Mutation = require('./resolvers/Mutation');
const AuthPayload = require('./resolvers/AuthPayload');

const resolvers = {
  Query,
  Mutation,
  AuthPayload,
};

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context: req => ({
    ...req,
    db: new Prisma({
      typeDefs: 'src/generated/prisma.graphql',
      endpoint: 'https://us1.prisma.sh/public-bigpalm-216/leaderboard-graphql/dev',
      secret: 'd41d8cd98f00b204e9800998ecf8427e',
      debug: true,
    }),
  }),
});

// eslint-disable-next-line no-console
server.start(() => console.log('Server is running on http://localhost:4000'));
