const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { APP_SECRET, getUserId } = require('../utils');

/* User */
const signup = async (root, args, context, info) => {
  const password = await bcrypt.hash(args.password, 10);
  const user = await context.db.mutation.createUser({
    data: { ...args, password },
  }, `{ id }`);
  const token = jwt.sign({ userId: user.id }, APP_SECRET);

  return {
    token,
    user,
  };
};

const login = async (root, args, context, info) => {
  const user = await context.db.query.user({ where: { email: args.email } }, `{ id password }`);
  if (!user) {
    throw new Error(`No such user found`);
  }

  const valid = await bcrypt.compare(args.password, user.password);
  if (!valid) {
    throw new Error(`Invalid password`);
  }

  const token = jwt.sign({ userId: user.id }, APP_SECRET);

  return {
    token,
    user,
  };
};

/* Team */
const createTeam = async (root, args, context, info) => {
  return context.db.mutation.createTeam({
    data: {
      name: args.name,
      category: args.category,
      members: args.members,
    },
  }, info);
};

/* Event */
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
  signup,
  login,
  createTeam,
  createEvent,
};
