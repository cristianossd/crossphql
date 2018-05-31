const createTeam = async (root, args, context, info) => {
  return context.db.mutation.createTeam({
    data: {
      name: args.name,
      category: args.category,
      members: args.members,
    },
  }, info);
};

const createEvent = async (root, args, context, info) => {
  const team = await context.db.query.team({
    where: { name: args.teamName },
  }, `{ id }`);

  if (!team) {
    throw new Error('You are trying to assign undefined team');
  }

  return context.db.mutation.createEvent({
    data: {
      order: args.order,
      fromTeam: { connect: { id: team.id } },
    },
  }, info)
};

module.exports = {
  createTeam,
  createEvent,
};
