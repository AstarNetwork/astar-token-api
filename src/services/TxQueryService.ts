import { createWeb3Instance, fetchEvmTransferDetails } from './../modules/tx-query/utils/index';
import axios from 'axios';
import { injectable } from 'inversify';
import { TransferDetails } from '../models/TxQuery';
import { networks, NetworkType } from '../networks';
import { getSubscanOption, getSubscanUrl } from '../utils';

export interface ITxQueryService {
    fetchTransferDetails(network: NetworkType, hash: string): Promise<TransferDetails | undefined>;
}

@injectable()
/**
 * Transaction query service
 */
export class TxQueryService implements ITxQueryService {
    /**
     * Fetch the transfer transaction detail of a given hash
     * @param network NetworkType (astar, shiden or shibuya)
     * @param hash transaction hash
     * @returns data object of the transaction detail
     */
    public async fetchTransferDetails(network: NetworkType, hash: string): Promise<TransferDetails | undefined> {
        try {
            const base = getSubscanUrl(network);
            const option = getSubscanOption();
            const url = base + '/api/scan/extrinsic';

            const { data } = await axios.post(
                url,
                {
                    hash,
                },
                option,
            );
            const isEvmTransfer = !data.data;
            if (isEvmTransfer) {
                const rpc = networks[network].evmRpc;
                const web3 = createWeb3Instance(rpc);
                return await fetchEvmTransferDetails({
                    hash,
                    web3,
                });
            } else {
                const timestamp = data.data.block_timestamp;
                const { from, to, success, asset_symbol, amount } = data.data.transfer;
                const chain = Object.values(networks).find((it) => it.name === network);
                const nativeToken = chain?.token || '';
                const symbol = asset_symbol || nativeToken;
                return { from, to, symbol, amount, isSuccess: success, timestamp };
            }
        } catch (e) {
            console.error(e);
        }
    }
}
