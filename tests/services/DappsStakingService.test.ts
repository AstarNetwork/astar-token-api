import { IApiFactory, ApiFactory } from '../../src/client/ApiFactory';
import { DappsStakingService } from '../../src/services/DappsStakingService';
import { AstarApiMock } from './AstarApiMock';

describe('getApr', () => {
    let apiFactory: IApiFactory;

    beforeEach(() => {
        apiFactory = new ApiFactory();
        apiFactory.getApiInstance = jest.fn().mockReturnValue(new AstarApiMock());
    });

    it('calculates APR', async () => {
        const service = new DappsStakingService(apiFactory);

        const result = await service.calculateApr();
        const roundedResult = Math.round(result * 10000) / 10000;

        expect(roundedResult).toBe(9.2977);
    });
});
