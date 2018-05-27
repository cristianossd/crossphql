const { GraphQLServer } = require('graphql-yoga');
const _ = require('lodash');

let teams = [{
  id: 'team-0',
  name: 'Maral Team',
  category: 'RX',
  members: ['Cristiano'],
}];

let idCount = teams.length;

const resolvers = {
  Query: {
    info: () => `This is the API of custom crossfit leaderboard`,
    feed: () => teams,
    team: (root, args) => {
      return _.find(teams, (t) => t.name === args.name)
    },
  },

  Mutation: {
    newTeam: (root, args) => {
      const team = {
        id: `team-${idCount++}`,
        name: args.name,
        category: args.category,
        members: args.members,
      };

      teams.push(team);
      return team;
    },

    updateTeam: (root, args) => {
      const index = _.findIndex(teams, (t) => t.name === args.name);
      teams[index].category = args.category || teams[index].category;
      teams[index].finalScore = args.finalScore || teams[index].finalScore;

      return teams[index];
    },

    deleteTeam: (root, { name }) => {
      const deleted = _.remove(teams, (t) => t.name === name);
      return _.head(deleted);
    },
  },

  Team: {
    id: (root) => root.id,
    name: (root) => root.name,
    category: (root) => root.category,
    members: (root) => root.members,
  },
};

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
});
server.start(() => console.log(`Server is running on http://localhost:4000`));
