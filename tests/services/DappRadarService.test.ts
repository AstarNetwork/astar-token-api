import 'reflect-metadata';
import { DappRadarService, IDappRadarService } from '../../src/services/DappRadarService';
import { FirebaseServiceMock } from './FirebaseServiceMock';
import { NetworkType } from '../../src/networks';

describe('DappRadarService methods parameters check', () => {
    let dappRadarService: IDappRadarService;
    const emptyNetwork = '' as NetworkType;
    const invalidNetwork = 'astar1' as NetworkType;

    beforeEach(() => {
        dappRadarService = new DappRadarService(new FirebaseServiceMock());
    });

    it('getDapps checks parameters', async () => {
        await expect(dappRadarService.getDapps(invalidNetwork)).rejects.toThrowError(
            `Network ${invalidNetwork} is not supported.`,
        );

        await expect(dappRadarService.getDapps(emptyNetwork)).rejects.toThrowError('network');
    });

    it('getAggregatedData checks parameters', async () => {
        await expect(dappRadarService.getAggregatedData(invalidNetwork, '7d')).rejects.toThrowError(
            `Network ${invalidNetwork} is not supported.`,
        );

        await expect(dappRadarService.getAggregatedData(emptyNetwork, '7d')).rejects.toThrowError('network');
        await expect(dappRadarService.getAggregatedData('astar', '')).rejects.toThrowError('period');
    });

    it('getDappTransactionsHistory checks parameters', async () => {
        await expect(
            dappRadarService.getDappTransactionsHistory('Test', 'http:://test.com', invalidNetwork),
        ).rejects.toThrowError(`Network ${invalidNetwork} is not supported.`);

        await expect(
            dappRadarService.getDappTransactionsHistory('Test', 'http:://test.com', emptyNetwork),
        ).rejects.toThrowError('network');
        await expect(dappRadarService.getDappTransactionsHistory('', 'http://test.com', 'astar')).rejects.toThrowError(
            'dappName',
        );
        await expect(dappRadarService.getDappTransactionsHistory('Test', '', 'astar')).rejects.toThrowError('dappUrl');
    });

    it('getDappUawHistory checks parameters', async () => {
        await expect(
            dappRadarService.getDappUawHistory('Test', 'http:://test.com', invalidNetwork),
        ).rejects.toThrowError(`Network ${invalidNetwork} is not supported.`);

        await expect(dappRadarService.getDappUawHistory('Test', 'http:://test.com', emptyNetwork)).rejects.toThrowError(
            'network',
        );
        await expect(dappRadarService.getDappUawHistory('', 'http://test.com', 'astar')).rejects.toThrowError(
            'dappName',
        );
        await expect(dappRadarService.getDappUawHistory('Test', '', 'astar')).rejects.toThrowError('dappUrl');
    });
});
