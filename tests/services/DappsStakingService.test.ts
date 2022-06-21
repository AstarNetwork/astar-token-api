import { IApiFactory, ApiFactory } from '../../src/client/ApiFactory';
import { DappsStakingService } from '../../src/services/DappsStakingService';
import { IFirebaseService } from '../../src/services/FirebaseService';
import { AstarApiMock } from './AstarApiMock';
import { FirebaseServiceMock } from './FirebaseServiceMock';

/**
 * Wrapper around DappsStakingService so protected methods can be tested
 */
class DappStakingServiceWrapper extends DappsStakingService {
    public async validateRegistrationRequest(
        signature: string,
        senderAddress: string,
        dappAddress: string,
    ): Promise<boolean> {
        return await super.validateRegistrationRequest(signature, senderAddress, dappAddress, 'astar');
    }

    public async isValidSignature(signedMessage: string, signature: string, signerAddress: string): Promise<boolean> {
        return super.isValidSignature(signedMessage, signature, signerAddress);
    }
}

describe('getApr', () => {
    let apiFactory: IApiFactory;
    let firebaseService: IFirebaseService;
    const signature =
        '0x2aeaa98e26062cf65161c68c5cb7aa31ca050cb5bdd07abc80a475d2a2eebc7b7a9c9546fbdff971b29419ddd9982bf4148c81a49df550154e1674a6b58bac84';
    const sender = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
    const dapp = '0xa0e232d596d6838d39ddde9b63916b42246be15e';

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
