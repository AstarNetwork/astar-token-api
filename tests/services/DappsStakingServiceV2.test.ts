import { ApiFactory } from '../../src/client/ApiFactory';
import { DappsStakingService2 } from '../../src/services/DappsStakingService2';
import { AstarApiMock } from './AstarApiMock';
import { FirebaseServiceMock } from './FirebaseServiceMock';

/**
 * Wrapper around DappsStakingService so protected methods can be tested
 */
class DappStakingServiceWrapper extends DappsStakingService2 {
    constructor() {
        const apiFactory = new ApiFactory();
        apiFactory.getApiInstance = jest.fn().mockReturnValue(new AstarApiMock());

        super(apiFactory, new FirebaseServiceMock());
    }

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

describe('DappsStakingServiceV2', () => {
    const signature =
        '0x121177d7dbffc54efe7f9bdf243220caa400237fe18aa3973b1502c7ae3e585f2501c1cdfd0a0823c130086ddf75ce6f0c7a4fb068337c10d1980fc707c61c8c';
    const sender = 'XLoLJBQoMPHMLXYhdFobSpH5GujRoUH8d1sUtaEtoBG7zaS';
    const dapp = '0x0000000000000000000000000000000000000001';

    it('validates dapp registration request', async () => {
        const service = new DappStakingServiceWrapper();

        const result = await service.validateRegistrationRequest(signature, sender, dapp);

        expect(result).toStrictEqual(true);
    });
});
