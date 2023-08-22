/* eslint-disable @typescript-eslint/no-explicit-any */

import { compactAddLength, hexToU8a, u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';
import { inject, injectable } from 'inversify';
import { IApiFactory } from '../client/ApiFactory';
import { ContainerTypes } from '../containertypes';
import { TransferDetails, XvmTxHistory } from '../models/TxQuery';
import { NetworkType } from '../networks';
import { SubscanExtrinsics } from './../models/TxQuery';
import { createWeb3Instance, fetchEvmTransferDetails } from './../modules/tx-query/utils/index';
import { networks } from './../networks';
import { ISubscanService } from './SubscanService';
import { ContractPromise } from '@polkadot/api-contract';
import ABI_XVM_ERC20 from '../modules/tx-query/abi/XVM_ERC20_TRANSFER.json';
import { formatEther } from 'ethers';
import { encodeAddress } from '@polkadot/util-crypto';

export const ASTAR_SS58_FORMAT = 5;

export interface ITxQueryService {
    fetchTransferDetails(network: NetworkType, hash: string): Promise<TransferDetails>;
    fetchXvmTransferHistory(
        network: NetworkType,
        senderAddress: string,
        contractAddress: string,
    ): Promise<XvmTxHistory[]>;
}

@injectable()
/**
 * Transaction query service
 */
export class TxQueryService implements ITxQueryService {
    constructor(
        @inject(ContainerTypes.SubscanService) private _subscan: ISubscanService,
        @inject(ContainerTypes.ApiFactory) private _apiFactory: IApiFactory,
    ) {}

    /**
     * Fetch the transfer transaction detail of a given hash
     * @param network NetworkType (astar, shiden, rocstar or shibuya)
     * @param hash transaction hash
     * @returns data object of the transaction detail
     */
    public async fetchTransferDetails(network: NetworkType, hash: string): Promise<TransferDetails> {
        try {
            const body = { hash: hash };
            const data = await this._subscan.fetchSubscan({ network, body, queryPath: 'extrinsic' });
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
                const chain = Object.values(networks).find((it) => it.name === network);
                const nativeToken = chain?.token || '';
                const isTransferNativeToken =
                    data.call_module === 'balances' && data.call_module_function === 'transfer_keep_alive';

                // Memo: Not sure why but Subscan returns 'null' in data.transfer for some transactions
                // e.g.: api/v1/astar/tx/transfer?hash=0x8a3397c0053329e49a60acdb39f1819e54379d5bcdd6666401094a266126c7bd
                if (!data.transfer && isTransferNativeToken) {
                    const { account_id, params, success } = data;
                    const toPublicKey = params.find((it: any) => it.name === 'dest').value.Id as string;
                    const amountDecimals = params.find((it: any) => it.name === 'value').value as string;
                    const amount = String(Number(formatEther(amountDecimals)));
                    const to = encodeAddress(toPublicKey, ASTAR_SS58_FORMAT);
                    return { from: account_id, to, symbol: nativeToken, amount, isSuccess: success, timestamp };
                }
                const { from, to, success, asset_symbol, amount } = data.transfer;
                const symbol = asset_symbol || nativeToken;
                return { from, to, symbol, amount, isSuccess: success, timestamp };
            }
        } catch (e) {
            console.error(e);
            throw new Error('Something went wrong');
        }
    }

    /**
     * Fetch the xvm-transfer transaction history of a given sender and contract address
     * @param network NetworkType (astar, shiden, rocstar or shibuya)
     * @param senderAddress SS58 wallet address
     * @param contractAddress SS58 XVM Transfer contract address
     * @returns array data of the transaction history
     */
    public async fetchXvmTransferHistory(
        network: NetworkType,
        senderAddress: string,
        contractAddress: string,
    ): Promise<XvmTxHistory[]> {
        try {
            const contractPublicId = u8aToHex(decodeAddress(contractAddress));
            const body = {
                row: 100,
                page: 0,
                address: senderAddress,
                method: 'contracts',
                call: 'call',
            };

            const apiInstance = this._apiFactory.getApiInstance(network);
            const [{ extrinsics }, api] = await Promise.all([
                this._subscan.fetchSubscan({ network, body, queryPath: 'extrinsics' }),
                apiInstance.getApiPromise(),
            ]);
            if (!extrinsics) return [];

            const contract = new ContractPromise(api, ABI_XVM_ERC20, String(contractAddress));
            const xvmTransfers: XvmTxHistory[] = extrinsics
                .filter((it: SubscanExtrinsics) => {
                    const params = JSON.parse(it.params);
                    const contractId = params.find((it: any) => it.name === 'dest').value.Id;
                    return contractId === contractPublicId;
                })
                .map((it: SubscanExtrinsics) => {
                    const params = JSON.parse(it.params);
                    const inputsData = params.find((it: any) => it.name === 'data').value;
                    const decodedMessage = contract.abi.decodeMessage(compactAddLength(hexToU8a(inputsData)));
                    const inputs = decodedMessage.args.map((arg) => arg.toString());

                    const to = JSON.parse(inputs[0]);
                    const destination = Object.values(to)[0] as string;
                    const amount = inputs[1] as string;
                    const erc20Address = inputs[2] as string;
                    return {
                        timestamp: it.block_timestamp as number,
                        extrinsicHash: it.extrinsic_hash as string,
                        destination,
                        amount,
                        erc20Address,
                    };
                });

            return xvmTransfers;
        } catch (e) {
            console.error(e);
            throw new Error('Something went wrong');
        }
    }
}
