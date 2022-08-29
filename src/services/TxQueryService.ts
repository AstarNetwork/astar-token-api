import { inject, injectable } from 'inversify';
import { ContainerTypes } from '../containertypes';
import { TransferDetails } from '../models/TxQuery';
import { NetworkType } from '../networks';
import { createWeb3Instance, fetchEvmTransferDetails } from './../modules/tx-query/utils/index';
import { networks } from './../networks';
import { ISubscanService } from './SubscanService';

export interface ITxQueryService {
    fetchTransferDetails(network: NetworkType, hash: string): Promise<TransferDetails>;
}

@injectable()
/**
 * Transaction query service
 */
export class TxQueryService implements ITxQueryService {
    constructor(@inject(ContainerTypes.SubscanService) private _subscan: ISubscanService) {}

    /**
     * Fetch the transfer transaction detail of a given hash
     * @param network NetworkType (astar, shiden or shibuya)
     * @param hash transaction hash
     * @returns data object of the transaction detail
     */
    public async fetchTransferDetails(network: NetworkType, hash: string): Promise<TransferDetails> {
        try {
            const type = 'transfer';
            const data = await this._subscan.fetchSubscan({ network, hash, type });
            const isEvmTransfer = !data;
            if (isEvmTransfer) {
                const rpc = networks[network].evmRpc;
                const web3 = createWeb3Instance(rpc);
                return await fetchEvmTransferDetails({
                    hash,
                    web3,
                });
            } else {
                const timestamp = data.block_timestamp;
                const { from, to, success, asset_symbol, amount } = data.transfer;
                const chain = Object.values(networks).find((it) => it.name === network);
                const nativeToken = chain?.token || '';
                const symbol = asset_symbol || nativeToken;
                return { from, to, symbol, amount, isSuccess: success, timestamp };
            }
        } catch (e) {
            console.error(e);
            throw new Error('Something went wrong');
        }
    }
}
