import axios from 'axios';
import { inject, injectable } from 'inversify';
import { ContainerTypes } from '../containertypes';
import { TransferDetails } from '../models/TxQuery';
import { NetworkType } from '../networks';
import { getSubscanUrl } from '../utils';
import { createWeb3Instance, fetchEvmTransferDetails } from './../modules/tx-query/utils/index';
import { networks } from './../networks';
import { IFirebaseService } from './FirebaseService';

export interface ITxQueryService {
    fetchTransferDetails(network: NetworkType, hash: string): Promise<TransferDetails | undefined>;
}

@injectable()
/**
 * Transaction query service
 */
export class TxQueryService implements ITxQueryService {
    constructor(@inject(ContainerTypes.FirebaseService) private _firebase: IFirebaseService) {}

    public async fetchSubscan({ network, hash, type }: { network: NetworkType; hash: string; type: string }) {
        const base = getSubscanUrl(network);
        // const option = getSubscanOption();
        const option = this._firebase.getSubscanOption();
        const url = base + '/api/scan/extrinsic';
        const { data } = await axios.post(
            url,
            {
                hash,
            },
            option,
        );
        return data.data;
    }
    /**
     * Fetch the transfer transaction detail of a given hash
     * @param network NetworkType (astar, shiden or shibuya)
     * @param hash transaction hash
     * @returns data object of the transaction detail
     */
    public async fetchTransferDetails(network: NetworkType, hash: string): Promise<TransferDetails> {
        try {
            const type = 'transfer';
            const data = await this.fetchSubscan({ network, hash, type });
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
