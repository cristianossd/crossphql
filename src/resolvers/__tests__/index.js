const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { head } = require('lodash');

const Query = require('../Query');
const AuthPayload = require('../AuthPayload');
const Mutation = require('../Mutation');
const { APP_SECRET, getUserId } = require('../../utils');

const TOKEN = '1fn9j983ef8923m89';
const infoMock = `{ id }`;
const hiddenMock = { flag: true };
const userMock = { id: 1, token: TOKEN, password: 'pass1234' };
const teamMock = { name: 'team', category: 'RX', members: '' };
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
      createTeam: jest.fn().mockReturnValue(teamMock),
      updateTeam: jest.fn().mockReturnValue(teamMock),
      deleteTeam: jest.fn().mockReturnValue(teamMock),
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
      }, `{ id password }`);
      expect(bcrypt.compare).toHaveBeenCalledWith('pass1234', 'pass1234');
    });

    it('should throw error for user not found', async () => {
      contextMock.db.query.user.mockReturnValue(null);
      return await Mutation.login({}, {
        email: 'cross@fit',
        password: 'pass1234',
      }, contextMock, infoMock).catch(e =>
        expect(e).toEqual(new Error(`No such user found`))
      );
    });

    it('should throw error for invalid password', async () => {
      contextMock.db.query.user.mockReturnValue(userMock);
      bcrypt.compare.mockResolvedValue(false);

      return await Mutation.login({}, {
        email: 'cross@fit',
        password: 'pass1234',
      }, contextMock, infoMock).catch(e =>
        expect(e).toEqual(new Error(`Invalid password`))
      );
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
  });
});
