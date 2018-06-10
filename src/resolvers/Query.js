const info = () => 'API responsible for a custom crossfit leaderboard';

const feed = (root, args, context, queryInfo) => context.db.query.teams({}, queryInfo);

const leaderboard = (root, args, context, queryInfo) => context.db.query.teams({
  where: { category: args.category },
  orderBy: 'finalScore_ASC',
}, queryInfo);

const team = (root, args, context, queryInfo) => context.db.query.team({
  where: { name: args.name },
}, queryInfo);

const hidden = (root, args, context, queryInfo) => context.db.query.hidden({
  where: { name: args.name },
}, queryInfo);

module.exports = {
  info,
  feed,
  leaderboard,
  team,
  hidden,
};
