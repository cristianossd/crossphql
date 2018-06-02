const info = (root, args, context, info) => {
  return `API responsible for a custom crossfit leaderboard`;
};

const feed = (root, args, context, info) => {
  return context.db.query.teams({}, info)
};

const leaderboard = (root, args, context, info) => {
  return context.db.query.teams({
    where: { category: args.category },
    orderBy: 'finalScore_ASC',
  }, info);
};

const team = (root, args, context, info) => {
  return context.db.query.team({
    where: { name: args.name },
  }, info)
};

module.exports = {
  info,
  feed,
  leaderboard,
  team,
};
