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

        expect(result).toBe(9.297716009226429);
    });
});
