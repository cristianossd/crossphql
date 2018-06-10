const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const Query = require('../Query');
const AuthPayload = require('../AuthPayload');
const Mutation = require('../Mutation');
const { APP_SECRET, getUserId } = require('../../utils');

const TOKEN = '1fn9j983ef8923m89';
const infoMock = '{ id }';
const hiddenMock = { name: 'hiddenResult', flag: true };
const userMock = { id: 1, token: TOKEN, password: 'pass1234' };
const eventMock = {
  id: 2, order: 1, ranking: 1, reps: 120,
};
const teamMock = {
  name: 'team', category: 'RX', members: '', events: [eventMock],
};
const contextMock = {
  db: {
    query: {
      teams: jest.fn().mockReturnValue([teamMock]),
      team: jest.fn().mockReturnValue(teamMock),
      hidden: jest.fn().mockReturnValue(hiddenMock),
      user: jest.fn().mockReturnValue(userMock),
      events: jest.fn().mockReturnValue([eventMock]),
    },

    mutation: {
      createUser: jest.fn().mockReturnValue(userMock),

      createTeam: jest.fn().mockReturnValue(teamMock),
      updateTeam: jest.fn().mockReturnValue(teamMock),
      deleteTeam: jest.fn().mockReturnValue(teamMock),

      createEvent: jest.fn().mockReturnValue(eventMock),
      updateEvent: jest.fn().mockReturnValue(eventMock),
      deleteEvent: jest.fn().mockReturnValue(eventMock),

      createHidden: jest.fn().mockReturnValue(hiddenMock),
      updateHidden: jest.fn().mockReturnValue(hiddenMock),
    },
  },
};

jest.mock('jsonwebtoken');
jwt.sign.mockReturnValue(TOKEN);

jest.mock('bcrypt');
bcrypt.hash.mockResolvedValue('pass1234');

jest.mock('../../utils');
getUserId.mockReturnValue(true);

describe('Query', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return query health check', () => {
    expect(Query.info()).toEqual('API responsible for a custom crossfit leaderboard');
  });

  it('should return feed of teams', () => {
    const result = Query.feed({}, {}, contextMock, infoMock);

    expect(result).toEqual([teamMock]);
    expect(contextMock.db.query.teams).toHaveBeenCalledTimes(1);
    expect(contextMock.db.query.teams).toHaveBeenCalledWith({}, infoMock);
  });

  it('should query leaderboard with sort filter', () => {
    const result = Query.leaderboard({}, {
      category: 'RX',
    }, contextMock, infoMock);

    expect(result).toEqual([teamMock]);
    expect(contextMock.db.query.teams).toHaveBeenCalledTimes(1);
    expect(contextMock.db.query.teams).toHaveBeenCalledWith({
      where: { category: 'RX' },
      orderBy: 'finalScore_ASC',
    }, infoMock);
  });

  it('should query single team', () => {
    const result = Query.team({}, {
      name: 'Maral',
    }, contextMock, infoMock);

    expect(result).toEqual(teamMock);
    expect(contextMock.db.query.team).toHaveBeenCalledTimes(1);
    expect(contextMock.db.query.team).toHaveBeenCalledWith({
      where: { name: 'Maral' },
    }, infoMock);
  });

  it('should query hidden flag', () => {
    const result = Query.hidden({}, {
      name: 'hiddenResult',
    }, contextMock, infoMock);

    expect(result).toEqual(hiddenMock);
    expect(contextMock.db.query.hidden).toHaveBeenCalledTimes(1);
    expect(contextMock.db.query.hidden).toHaveBeenCalledWith({
      where: { name: 'hiddenResult' },
    }, infoMock);
  });
});

describe('AuthPayload', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should query user', () => {
    expect(AuthPayload.user({
      user: { id: 1 },
    }, {}, contextMock, infoMock)).toEqual(userMock);
    expect(contextMock.db.query.user).toHaveBeenCalledTimes(1);
    expect(contextMock.db.query.user).toHaveBeenCalledWith({
      where: { id: 1 },
    }, infoMock);
  });
});

describe('Mutation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User', () => {
    it('should signup', async () => {
      const result = await Mutation.signup({}, {
        email: 'cross@fit',
        password: 'pass1234',
      }, contextMock, infoMock);

      expect(result).toEqual({
        token: userMock.token,
        user: userMock,
      });
      expect(contextMock.db.mutation.createUser).toHaveBeenCalledTimes(1);
      expect(contextMock.db.mutation.createUser).toHaveBeenCalledWith({
        data: { email: 'cross@fit', password: 'pass1234' },
      }, infoMock);

      expect(jwt.sign).toHaveBeenCalledWith({ userId: userMock.id }, APP_SECRET);
    });

    it('should login an user', async () => {
      bcrypt.compare.mockResolvedValue(true);

      const result = await Mutation.login({}, {
        email: 'cross@fit',
        password: 'pass1234',
      }, contextMock, infoMock);

      expect(result).toEqual({
        token: userMock.token,
        user: userMock,
      });
      expect(contextMock.db.query.user).toHaveBeenCalledTimes(1);
      expect(contextMock.db.query.user).toHaveBeenCalledWith({
        where: { email: 'cross@fit' },
      }, '{ id password }');
      expect(bcrypt.compare).toHaveBeenCalledWith('pass1234', 'pass1234');
    });

    it('should throw error for user not found', () => {
      contextMock.db.query.user.mockReturnValue(null);
      return Mutation.login({}, {
        email: 'cross@fit',
        password: 'pass1234',
      }, contextMock, infoMock).catch(e =>
        expect(e).toEqual(new Error('No such user found')));
    });

    it('should throw error for invalid password', () => {
      contextMock.db.query.user.mockReturnValue(userMock);
      bcrypt.compare.mockResolvedValue(false);

      return Mutation.login({}, {
        email: 'cross@fit',
        password: 'pass1234',
      }, contextMock, infoMock).catch(e =>
        expect(e).toEqual(new Error('Invalid password')));
    });
  });

  describe('Team', () => {
    it('should create a team', async () => {
      const result = await Mutation.createTeam({}, teamMock, contextMock, infoMock);

      expect(result).toEqual(teamMock);
      expect(contextMock.db.mutation.createTeam).toHaveBeenCalledTimes(1);
      expect(contextMock.db.mutation.createTeam).toHaveBeenCalledWith({
        data: {
          name: teamMock.name,
          category: teamMock.category,
          members: teamMock.members,
        },
      }, infoMock);
    });

    it('should update a team', async () => {
      const result = await Mutation.updateTeam({}, teamMock, contextMock, infoMock);

      expect(result).toEqual(teamMock);
      expect(contextMock.db.mutation.updateTeam).toHaveBeenCalledTimes(1);
      expect(contextMock.db.mutation.updateTeam).toHaveBeenCalledWith({
        where: { name: teamMock.name },
        data: teamMock,
      }, infoMock);
    });

    it('should delete a team', async () => {
      const result = await Mutation.deleteTeam({}, teamMock, contextMock, infoMock);

      expect(result).toEqual(teamMock);
      expect(contextMock.db.mutation.deleteTeam).toHaveBeenCalledTimes(1);
      expect(contextMock.db.mutation.deleteTeam).toHaveBeenCalledWith({
        where: { name: teamMock.name },
      }, infoMock);
    });

    it('should set teams score', async () => {
      const result = await Mutation.setTeamsScore({}, { category: 'RX' }, contextMock, infoMock);

      expect(result).toEqual('RX ranking updated');
      expect(contextMock.db.query.teams).toHaveBeenCalledTimes(1);
      expect(contextMock.db.query.teams).toHaveBeenCalledWith({
        where: { category: 'RX' },
      }, '{ id name finalScore events { ranking } }');
      expect(contextMock.db.mutation.updateTeam).toHaveBeenCalledTimes(1);
      expect(contextMock.db.mutation.updateTeam).toHaveBeenCalledWith({
        where: { name: teamMock.name },
        data: { finalScore: eventMock.ranking },
      }, '{ id finalScore }');
    });
  });

  describe('Event', () => {
    it('should create event', async () => {
      const result = await Mutation.createEvent({}, {
        order: eventMock.order,
        teamName: teamMock.name,
      }, contextMock, infoMock);

      expect(result).toEqual(eventMock);
      expect(contextMock.db.query.team).toHaveBeenCalledTimes(1);
      expect(contextMock.db.query.team).toHaveBeenCalledWith({
        where: { name: teamMock.name },
      }, '{ id }');
      expect(contextMock.db.mutation.createEvent).toHaveBeenCalledTimes(1);
      expect(contextMock.db.mutation.createEvent).toHaveBeenCalledWith({
        data: {
          order: eventMock.order,
          fromTeam: { connect: { id: teamMock.id } },
        },
      }, infoMock);
    });

    it('should update event', async () => {
      const result = await Mutation.updateEvent({}, {
        id: eventMock.id,
        teamName: teamMock.name,
        ranking: eventMock.ranking,
      }, contextMock, infoMock);

      expect(result).toEqual(eventMock);
      expect(contextMock.db.query.team).toHaveBeenCalledTimes(1);
      expect(contextMock.db.query.team).toHaveBeenCalledWith({
        where: { name: teamMock.name },
      }, '{ id }');

      expect(contextMock.db.mutation.updateEvent).toHaveBeenCalledTimes(1);
      expect(contextMock.db.mutation.updateEvent).toHaveBeenCalledWith({
        where: { id: eventMock.id },
        data: { ranking: eventMock.ranking },
      }, infoMock);
    });

    it('should\'not update event with a not found team', () => {
      contextMock.db.query.team.mockResolvedValue(false);

      return Mutation.updateEvent({}, {
        team: teamMock.name,
      }, contextMock, infoMock).catch(e =>
        expect(e).toEqual(new Error('You are trying to use undefined team')));
    });

    it('should delete event', async () => {
      contextMock.db.query.team.mockResolvedValue(teamMock);

      const result = await Mutation.deleteEvent({}, {
        id: eventMock.id,
        teamName: teamMock.name,
      }, contextMock, infoMock);

      expect(result).toEqual(eventMock);
      expect(contextMock.db.query.team).toHaveBeenCalledTimes(1);
      expect(contextMock.db.query.team).toHaveBeenCalledWith({
        where: { name: teamMock.name },
      }, '{ id }');

      expect(contextMock.db.mutation.deleteEvent).toHaveBeenCalledTimes(1);
      expect(contextMock.db.mutation.deleteEvent).toHaveBeenCalledWith({
        where: { id: eventMock.id },
      }, infoMock);
    });

    it('should\'not delete event with not found team', () => {
      contextMock.db.query.team.mockResolvedValue(false);

      return Mutation.deleteEvent({}, {
        team: teamMock.name,
      }, contextMock, infoMock).catch(e =>
        expect(e).toEqual(new Error('You are trying to use undefined team')));
    });

    it('should set event ranking', async () => {
      const result = await Mutation.setEventRanking({}, {
        order: eventMock.order,
        category: teamMock.category,
      }, contextMock, infoMock);

      expect(result).toEqual(`${teamMock.category} ranking updated`);
      expect(contextMock.db.query.events).toHaveBeenCalledTimes(1);
      expect(contextMock.db.query.events).toHaveBeenCalledWith({
        where: {
          order: eventMock.order,
          fromTeam: { category: teamMock.category },
        },
      }, '{ id order time reps weight ranking fromTeam { category }}');

      expect(contextMock.db.mutation.updateEvent).toHaveBeenCalledTimes(1);
      expect(contextMock.db.mutation.updateEvent).toHaveBeenCalledWith({
        where: { id: eventMock.id },
        data: { ranking: eventMock.ranking },
      }, '{ id ranking }');
    });
  });

  describe('Hidden flags', () => {
    it('should create hidden flag', async () => {
      const result = await Mutation.createHidden({}, {
        name: hiddenMock.name,
        flag: hiddenMock.flag,
      }, contextMock, infoMock);

      expect(result).toEqual(hiddenMock);
      expect(contextMock.db.mutation.createHidden).toHaveBeenCalledTimes(1);
      expect(contextMock.db.mutation.createHidden).toHaveBeenCalledWith({
        data: hiddenMock,
      }, infoMock);
    });

    it('should update hidden flag', async () => {
      const result = await Mutation.updateHidden({}, {
        name: hiddenMock.name,
        flag: hiddenMock.flag,
      }, contextMock, infoMock);

      expect(result).toEqual(hiddenMock);
      expect(contextMock.db.mutation.updateHidden).toHaveBeenCalledTimes(1);
      expect(contextMock.db.mutation.updateHidden).toHaveBeenCalledWith({
        where: { name: hiddenMock.name },
        data: { flag: hiddenMock.flag },
      }, infoMock);
    });
  });
});
