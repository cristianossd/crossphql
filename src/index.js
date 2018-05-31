const { GraphQLServer } = require('graphql-yoga');
const { Prisma } = require('prisma-binding');

const resolvers = {
  Query: {
    info: () => `This is the API of custom crossfit leaderboard`,
    team: (root, args, context, info) => {
      return context.db.query.team({
        where: { name: args.name },
      }, info);
    },
  },

  Mutation: {
    createTeam: (root, args, context, info) => {
      return context.db.mutation.createTeam({
        data: {
          name: args.name,
          category: args.category,
          members: args.members,
        },
      }, info);
    },
  },
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

server.start(() => console.log(`Server is running on http://localhost:4000`));
