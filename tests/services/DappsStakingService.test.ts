import { IApiFactory, ApiFactory } from '../../src/client/ApiFactory';
import { DappsStakingService } from '../../src/services/DappsStakingService';
import { DappsStakingService2 } from '../../src/services/DappsStakingService2';
import { IFirebaseService } from '../../src/services/FirebaseService';
import { AstarApiMock } from './AstarApiMock';
import { FirebaseServiceMock } from './FirebaseServiceMock';

describe('getApr', () => {
    let apiFactory: IApiFactory;
    let firebaseService: IFirebaseService;

    beforeEach(() => {
        apiFactory = new ApiFactory();
        apiFactory.getApiInstance = jest.fn().mockReturnValue(new AstarApiMock());
        firebaseService = new FirebaseServiceMock();
    });

    it('calculates APR', async () => {
        const service = new DappsStakingService(apiFactory, firebaseService);

        const result = await service.calculateApr();
        const roundedResult = Math.round(result * 10000) / 10000;

        expect(roundedResult).toBe(9.2977);
    });
});
