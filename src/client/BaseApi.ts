import { ApiPromise, WsProvider } from '@polkadot/api';
import { u32, u128, Option, Struct, Enum } from '@polkadot/types';
import { PalletBalancesAccountData } from '@polkadot/types/lookup';
import { Header, AccountId, DispatchError, Call } from '@polkadot/types/interfaces';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult, ITuple } from '@polkadot/types/types';
import BN from 'bn.js';
import { AprCalculationData } from '../models/AprCalculationData';
import { networks } from '../networks';
import { EraRewardAndStake } from '../types/DappsStaking';

interface DappInfo extends Struct {
    developer: AccountId;
}

interface SmartContract extends Enum {
    readonly Evm: string;
    readonly Wasm: string;
}

export type Transaction = SubmittableExtrinsic<'promise', ISubmittableResult>;

export interface IAstarApi {
    getTotalSupply(): Promise<u128>;
    getBalances(addresses: string[]): Promise<PalletBalancesAccountData[]>;
    getChainDecimals(): Promise<number>;
    getAprCalculationData(): Promise<AprCalculationData>;
    getTvl(): Promise<BN>;
    getChainName(): Promise<string>;
    getTransactionFromHex(transactionHex: string): Promise<Transaction>;
    sendTransaction(transaction: Transaction): Promise<string>;
    getCallFromHex(callHex: string): Promise<Call>;
}

export class BaseApi implements IAstarApi {
    protected _api: ApiPromise;

    constructor(private endpoint = networks.astar.endpoint) {}

    public async getTotalSupply(): Promise<u128> {
        await this.connect();

        return await this._api.query.balances.totalIssuance();
    }

    public async getBalances(addresses: string[]): Promise<PalletBalancesAccountData[]> {
        await this.connect();
        const balances = await this._api.query.system.account.multi(addresses);

        return balances.map((balance) => balance.data);
    }

    public async getChainDecimals(): Promise<number> {
        await this.connect();
        const decimals = this._api.registry.chainDecimals;

        return decimals[0];
    }

    public async getAprCalculationData(): Promise<AprCalculationData> {
        await this.connect();
        const results = await Promise.all([
            this._api.consts.blockReward.rewardAmount,
            this._api.query.timestamp.now(),
            this._api.rpc.chain.getHeader(),
            this._api.consts.dappsStaking.developerRewardPercentage.toHuman(),
            this._api.consts.dappsStaking.blockPerEra,
        ]);

        const result = new AprCalculationData();
        result.blockRewards = results[0] as u128;
        result.timeStamp = results[1];
        result.latestBlock = (results[2] as Header).number.unwrap();
        result.developerRewardPercentage = Number(results[3]?.toString().replace('%', '')) * 0.01;
        result.blockPerEra = results[4] as u32;

        return result;
    }

    public async getTvl(): Promise<BN> {
        const era = await this._api.query.dappsStaking.currentEra();
        const result = await this._api.query.dappsStaking.eraRewardsAndStakes<Option<EraRewardAndStake>>(era);
        const tvl = result.unwrap().staked;
        return tvl;
    }

    public async getChainName(): Promise<string> {
        await this.connect();

        return (await this._api.rpc.system.chain()).toString() || 'development-dapps';
    }

    public async sendTransaction(transaction: Transaction): Promise<string> {
        return new Promise(async (resolve, reject) => {
            try {
                await transaction.send((result) => {
                    if (result.isFinalized) {
                        let message = '';
                        result.events
                            .filter((record): boolean => !!record.event && record.event.section !== 'democracy')
                            .map(({ event: { data, method, section } }) => {
                                if (section === 'system' && method === 'ExtrinsicFailed') {
                                    const [dispatchError] = data as unknown as ITuple<[DispatchError]>;
                                    message = dispatchError.type.toString();

                                    if (dispatchError.isModule) {
                                        try {
                                            const mod = dispatchError.asModule;
                                            const error = dispatchError.registry.findMetaError(mod);

                                            message = `${error.section}.${error.name}`;
                                        } catch (error) {
                                            // swallow
                                            console.error(error);
                                        }
                                    } else if (dispatchError.isToken) {
                                        message = `${dispatchError.type}.${dispatchError.asToken.type}`;
                                    }

                                    reject(message);
                                } else if (section === 'utility' && method === 'BatchInterrupted') {
                                    const anyData = data as any;
                                    const error = anyData[1].registry.findMetaError(anyData[1].asModule);
                                    let message = `${error.section}.${error.name}`;
                                    message = `action: ${section}.${method} ${message}`;
                                    reject(message);
                                }
                            });
                        resolve('');
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    public async getTransactionFromHex(transactionHex: string): Promise<Transaction> {
        await this.connect();

        return this._api.tx(transactionHex);
    }

    public async getCallFromHex(callHex: string): Promise<Call> {
        await this.connect();

        return this._api.createType('Call', callHex);
    }

    protected async connect() {
        // establish node connection with the endpoint
        if (!this._api) {
            const provider = new WsProvider(this.endpoint);
            const api = new ApiPromise({ provider });
            const apiInst = await api.isReady;
            this._api = apiInst;
        }

        return this._api;
    }
}
