import { IApiFactory, ApiFactory } from '../../src/client/ApiFactory';
import { StatsService } from '../../src/services/StatsService';
import { AstarApiMock } from './AstarApiMock';

/**
 * Tests are writen adhering to AAA (Arange, Act, Assert) pattern.
 */
describe('getTokenStats', () => {
    let apiFactory: IApiFactory;

    beforeEach(() => {
        apiFactory = new ApiFactory();
        apiFactory.getApiInstance = jest.fn().mockReturnValue(new AstarApiMock());
    });

    it('calculates circulating supply', async () => {
        const service = new StatsService(apiFactory);

        const result = await service.getTokenStats('astar');

        expect(result.circulatingSupply).toBe(83);
    });

    it('returns valid total supply', async () => {
        const service = new StatsService(apiFactory);

        const result = await service.getTokenStats('astar');

        expect(result.totalSupply).toBe(100);
    });
});
