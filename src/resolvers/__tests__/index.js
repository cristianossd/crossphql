const { head } = require('lodash');
const Query = require('../Query');

const infoMock = `{ id }`;
const hiddenMock = { data: { hidden: { flag: true } } };
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
    },
  },
};

describe('Query', () => {
  it('should return query health check', () => {
    expect(Query.info()).toEqual(
      `API responsible for a custom crossfit leaderboard`,
    );
  });

  it('should return feed of teams', () => {
    const result = Query.feed({}, {}, contextMock, infoMock);

    expect(result).toEqual(teamsMock);
    expect(contextMock.db.query.teams).toHaveBeenCalledWith({}, infoMock);
  });

  it('should query leaderboard with sort filter', () => {
    const result = Query.leaderboard({}, {
      category: 'RX',
    }, contextMock, infoMock);

    expect(result).toEqual(teamsMock);
    expect(contextMock.db.query.teams).toHaveBeenCalledWith({
      where: { category: 'RX' },
      orderBy: 'finalScore_ASC',
    }, infoMock);
  });

  if('should query single team', () => {
    const result = Query.team({}, {
      name: 'Maral',
    }, contextMock, infoMock);

    expect(result).toEqual(head(teamsMock.data.teams));
    expect(contextMock.db.query.team).toHaveBeenCalledWith({
      where: { name: 'Maral' },
    }, infoMock);
  });

  it('should query hidden flag', () => {
    const result = Query.hidden({}, {
      name: 'hiddenResult',
    }, contextMock, infoMock);

    expect(result).toEqual(hiddenMock);
    expect(contextMock.db.query.hidden).toHaveBeenCalledWith({
      where: { name: 'hiddenResult' },
    }, infoMock);
  });
});
