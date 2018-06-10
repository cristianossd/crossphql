const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { head } = require('lodash');

const Query = require('../Query');
const AuthPayload = require('../AuthPayload');
const Mutation = require('../Mutation');
const { APP_SECRET } = require('../../utils');

const TOKEN = '1fn9j983ef8923m89';
const infoMock = `{ id }`;
const hiddenMock = { flag: true };
const userMock = { id: 1, token: TOKEN };
const teamsMock = {
  data: {
    teams: [
      { name: 'Maral', category: 'RX' },
      { name: 'Mayhem', category: 'RX' },
    ],
  },
};

const contextMock = {
  db: {
    query: {
      teams: jest.fn().mockReturnValue(teamsMock),
      team: jest.fn().mockReturnValue(head(teamsMock.data.teams)),
      hidden: jest.fn().mockReturnValue(hiddenMock),
      user: jest.fn().mockReturnValue(userMock),
    },

    mutation: {
      createUser: jest.fn().mockReturnValue(userMock),
    },
  },
};

jest.mock('jsonwebtoken');
jwt.sign.mockReturnValue(TOKEN);

jest.mock('bcrypt');
bcrypt.hash.mockResolvedValue('pass1234');

describe('Query', () => {
  afterEach(() => {
    contextMock.db.query.teams.mockClear();
    contextMock.db.query.team.mockClear();
    contextMock.db.query.hidden.mockClear();
  });

  it('should return query health check', () => {
    expect(Query.info()).toEqual(
      `API responsible for a custom crossfit leaderboard`,
    );
  });

  it('should return feed of teams', () => {
    const result = Query.feed({}, {}, contextMock, infoMock);

    expect(result).toEqual(teamsMock);
    expect(contextMock.db.query.teams).toHaveBeenCalledTimes(1);
    expect(contextMock.db.query.teams).toHaveBeenCalledWith({}, infoMock);
  });

  it('should query leaderboard with sort filter', () => {
    const result = Query.leaderboard({}, {
      category: 'RX',
    }, contextMock, infoMock);

    expect(result).toEqual(teamsMock);
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

    expect(result).toEqual(head(teamsMock.data.teams));
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
    contextMock.db.query.user.mockClear();
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
    contextMock.db.mutation.createUser.mockClear();
  });

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
});
