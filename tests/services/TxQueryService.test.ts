import { AstarApiMock } from './AstarApiMock';
import 'reflect-metadata';
import { TxQueryService } from '../../src/services/TxQueryService';
import { IApiFactory } from '../../src/client/ApiFactory';
import { ISubscanService } from './../../src/services/SubscanService';
import { SubscanServiceMock } from './SubscanServiceMock';

describe('fetch the transaction details', () => {
    let subscanMock: ISubscanService;
    let apiFactory: IApiFactory;

    beforeEach(() => {
        subscanMock = new SubscanServiceMock();
        apiFactory = new AstarApiMock();
    });

    it('return the transfer details', async () => {
        const service = new TxQueryService(subscanMock, apiFactory);
        const hash = '0x66b432feb410848602bfbdf5be34eff4124c820f3ab2492c59768dd4c58e92a0';
        const result = await service.fetchTransferDetails('shiden', hash);
        const { amount, from, to, symbol, timestamp, isSuccess } = result;
        expect(amount).toBe('1');
        expect(from).toBe('axodJWpkSi9E5k7SgewYCCnTMZw3y6n79nuLevTCGFt7ADw');
        expect(to).toBe('abY8KzLhgi2xe5RqiDW5kngFF9gwRbhR7eP53cCawqkWmX4');
        expect(symbol).toBe('SDN');
        expect(isSuccess).toBe(true);
        expect(timestamp).toBe(1657859490);
    });
});
