import { ApiFactory } from '../../src/client/ApiFactory';
import { NewDappItem } from '../../src/models/Dapp';
import { DappsStakingService2 } from '../../src/services/DappsStakingService2';
import { AstarApiMock } from './AstarApiMock';
import { FirebaseServiceMock } from './FirebaseServiceMock';

/**
 * Wrapper around DappsStakingService so protected methods can be tested.
 */
class DappStakingServiceWrapper extends DappsStakingService2 {
    apiMock: AstarApiMock;
    firebaseMock: FirebaseServiceMock;

    constructor() {
        const apiFactory = new ApiFactory();
        const apiMock = new AstarApiMock();
        const firebaseMock = new FirebaseServiceMock();
        apiFactory.getApiInstance = jest.fn().mockReturnValue(apiMock);

        super(apiFactory, firebaseMock);

        this.apiMock = apiMock;
        this.firebaseMock = firebaseMock;
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

// Valid signature for sender and dapp specified below.
const signature =
    '0x58811d7d14b191af3108dc914e17d23439c56fc47b7d5e93e91bd7380c8a9d593c76433ff6816c3ad2df904f83bc1ca85411d9b4491f630a48a0a33fa260ef0501';
const sender = 'Zzdtpvexzqmhek2aKgHFp1EYHrSmCU3qjo99LPjUrcKYUat';
const dapp = '0x0000000000000000000000000000000000000001';

describe('validateRegistrationRequest', () => {
    it('validates proper registration request', async () => {
        const service = new DappStakingServiceWrapper();
        service.apiMock.getRegisteredDapp = jest.fn().mockReturnValue({
            developer: sender,
            state: 'Registered',
        });

        const result = await service.validateRegistrationRequest(signature, sender, dapp);

        expect(result).toStrictEqual(true);
    });

    it('fails if sender address is not valid', async () => {
        const service = new DappStakingServiceWrapper();
        const invalidSender = '5F3sa2TJAWMqDhXG6jhV4N8ko9SxwGy8TpaNS1repo5EYjQX';

        const result = await service.validateRegistrationRequest(signature, invalidSender, dapp);

        expect(result).toStrictEqual(false);
    });

    it('fails if contract address is not valid', async () => {
        const service = new DappStakingServiceWrapper();
        const dapp = '0x0000000000000000000000000000000000000002';

        const result = await service.validateRegistrationRequest(signature, sender, dapp);

        expect(result).toStrictEqual(false);
    });

    it('fails if dapp is never registered', async () => {
        const service = new DappStakingServiceWrapper();
        service.apiMock.getRegisteredDapp = jest.fn().mockReturnValue(undefined);

        await expect(service.validateRegistrationRequest(signature, sender, dapp)).rejects.toThrow(
            'The dapp 0x0000000000000000000000000000000000000001 is not registered with developer account Zzdtpvexzqmhek2aKgHFp1EYHrSmCU3qjo99LPjUrcKYUat',
        );
    });

    it('fails if dapp is registered with different developer', async () => {
        const service = new DappStakingServiceWrapper();
        service.apiMock.getRegisteredDapp = jest.fn().mockReturnValue({
            developer: '5F3sa2TJAWMqDhXG6jhV4N8ko9SxwGy8TpaNS1repo5EYjQX',
            state: 'Registered',
        });

        const result = await service.validateRegistrationRequest(signature, sender, dapp);

        expect(result).toStrictEqual(false);
    });

    it('fails if dapp is unregistered', async () => {
        const service = new DappStakingServiceWrapper();
        service.apiMock.getRegisteredDapp = jest.fn().mockReturnValue({
            developer: sender,
            state: 'Unregistered',
        });

        const result = await service.validateRegistrationRequest(signature, sender, dapp);

        expect(result).toStrictEqual(false);
    });
});

describe('registerDapp', () => {
    const registerPayload = {
        signature,
        senderAddress: sender,
        address: dapp,
    } as NewDappItem;

    it('stores to firebase if valid signature', async () => {
        const service = new DappStakingServiceWrapper();
        const network = 'development';
        service.apiMock.getRegisteredDapp = jest.fn().mockReturnValue({
            developer: sender,
            state: 'Registered',
        });
        service.firebaseMock.registerDapp = jest.fn();

        const result = await service.registerDapp(registerPayload, network);

        expect(service.firebaseMock.registerDapp).toBeCalledTimes(1);
        expect(service.firebaseMock.registerDapp).toBeCalledWith(registerPayload, network);
    });

    it('throws error if invalid signature', async () => {
        const service = new DappStakingServiceWrapper();
        // assign invalid sender address.
        registerPayload.senderAddress = '5F3sa2TJAWMqDhXG6jhV4N8ko9SxwGy8TpaNS1repo5EYjQX';

        await expect(service.registerDapp(registerPayload, 'development')).rejects.toThrow(
            'Provided signature is not valid',
        );
    });
});
