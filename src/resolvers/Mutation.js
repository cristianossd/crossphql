const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const { APP_SECRET, getUserId } = require('../utils');

// User
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

// Team
const createTeam = async (root, args, context, info) => {
  getUserId(context);

  return context.db.mutation.createTeam({
    data: {
      name: args.name,
      category: args.category,
      members: args.members,
    },
  }, info);
};

const updateTeam = async (root, args, context, info) => {
  getUserId(context);

  return context.db.mutation.updateTeam({
    where: { name: args.name },
    data: args,
  }, info);
};

const deleteTeam = async (root, args, context, info) => {
  getUserId(context);

  return context.db.mutation.deleteTeam({
    where: { name: args.name },
  }, info);
};

const setTeamsScore = async (root, args, context, info) => {
  getUserId(context);

  const teams = await context.db.query.teams({
    where: {
      category: args.category,
    },
  }, `{ id name finalScore events { ranking } }`);

  const scoredTeams = teams.map(team => {
    const finalScore = _.sumBy(team.events, (event) => event.ranking);
    return {
      id: team.id,
      name: team.name,
      finalScore: finalScore > 0 ? finalScore : 999,
    };
  });

  await Promise.all(scoredTeams.map((team) => (
    context.db.mutation.updateTeam({
      where: { name: team.name },
      data: { finalScore: team.finalScore },
    }, `{ id finalScore }`)
  ))).catch(err => {
    throw new Error('Retry team final scores setup');
  });

  return `${args.category} ranking updated`
};

// Event
const createEvent = async (root, args, context, info) => {
  getUserId(context);

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

const updateEvent = async (root, args, context, info) => {
  getUserId(context);

  const team = await context.db.query.team({
    where: { name: args.teamName },
  }, `{ id }`);

  if (!team) {
    throw new Error('You are trying to use undefined team');
  }

  const eventId = args.id;
  delete args.id;
  delete args.teamName;

  return context.db.mutation.updateEvent({
    where: { id: eventId },
    data: args,
  }, info);
};

const deleteEvent = async (root, args, context, info) => {
  getUserId(context);

  const team = await context.db.query.team({
    where: { name: args.teamName },
  }, `{ id }`);

  if (!team) {
    throw new Error('You are trying to use undefined team');
  }

  return context.db.mutation.deleteEvent({
    where: { id: args.id },
  }, info);
};

const setEventRanking = async (root, args, context, info) => {
  getUserId(context);

  const events = await context.db.query.events({
    where: {
      order: args.order,
      fromTeam: { category: args.category },
    },
  }, `{  id order time reps weight ranking fromTeam { category }}`);

  const rankedEvents = _.sortBy(events, (event) => {
    const { time, reps, weight } = event;

    if (time) {
      const [minutes, seconds] = time.split(':').map(unit => parseInt(unit, 10));
      return (minutes*60 + seconds);
    } else if (reps) {
      return -reps;
    } else if (weight) {
      return -weight;
    }
  });

  await Promise.all(rankedEvents.map((event, index) => (
    context.db.mutation.updateEvent({
      where: { id: event.id },
      data: { ranking: index + 1 },
    }, `{ id ranking }`)
  ))).catch(err => {
    throw new Error('Retry event ranking setup');
  });

  return `${args.category} ranking updated`
};

// Hidden
const createHidden = async (root, args, context, info) => {
  return context.db.mutation.createHidden({
    data: {
      name: args.name,
      flag: args.flag,
    },
  }, info);
};

const updateHidden = async (root, args, context, info) => {
  return context.db.mutation.updateHidden({
    where: { name: args.name },
    data: { flag: args.flag },
  }, info);
};

module.exports = {
  signup,
  login,
  createTeam,
  updateTeam,
  deleteTeam,
  setTeamsScore,
  createEvent,
  updateEvent,
  deleteEvent,
  setEventRanking,
  createHidden,
  updateHidden,
};
