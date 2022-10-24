import { ApiPromise, WsProvider } from '@polkadot/api';
import { isEthereumAddress, checkAddress, decodeAddress, encodeAddress } from '@polkadot/util-crypto';
import { hexToU8a, isHex } from '@polkadot/util';
import { u32, u128, Option, Struct, Enum } from '@polkadot/types';
import { PalletBalancesAccountData } from '@polkadot/types/lookup';
import { Header, AccountId, DispatchError, Call } from '@polkadot/types/interfaces';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { ISubmittableResult, ITuple } from '@polkadot/types/types';
import { Null, Result } from '@polkadot/types-codec';
import BN from 'bn.js';
import { AprCalculationData } from '../models/AprCalculationData';
import { networks } from '../networks';
import { EraRewardAndStake } from '../types/DappsStaking';

export interface DappInfo extends Struct {
    developer: AccountId;
    state: string;
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
    getRegisterDappPayload(dappAddress: string, developerAddress: string): Promise<string>;
    getRegisteredDapp(dappAddress: string): Promise<DappInfo | undefined>;
}

export class BaseApi implements IAstarApi {
    protected _api: ApiPromise;

    constructor(private endpoints = networks.astar.endpoints) {}

    public async getTotalSupply(): Promise<u128> {
        await this.ensureConnection();

        return await this._api.query.balances.totalIssuance();
    }

    public async getBalances(addresses: string[]): Promise<PalletBalancesAccountData[]> {
        await this.ensureConnection();
        const balances = await this._api.query.system.account.multi(addresses);

        return balances.map((balance) => balance.data);
    }

    public async getChainDecimals(): Promise<number> {
        await this.ensureConnection();
        const decimals = this._api.registry.chainDecimals;

        return decimals[0];
    }

    public async getAprCalculationData(): Promise<AprCalculationData> {
        await this.ensureConnection();
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
        await this.ensureConnection();

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
                                    message = this.getErrorMessage(dispatchError);
                                    reject(message);
                                } else if (section === 'ethCall' && method === 'Executed') {
                                    const [, dispatchError] = data as unknown as ITuple<[Result<Null, DispatchError>]>;

                                    if (dispatchError && dispatchError.isErr) {
                                        message = this.getErrorMessage(dispatchError.asErr);
                                        reject(message);
                                    }
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
        await this.ensureConnection();

        return this._api.tx(transactionHex);
    }

    public async getCallFromHex(callHex: string): Promise<Call> {
        await this.ensureConnection();

        return this._api.createType('Call', callHex);
    }

    public async getRegisterDappPayload(dappAddress: string, developerAddress: string): Promise<string> {
        await this.ensureConnection();
        const payload = this._api.tx.dappsStaking.register(developerAddress, this.getAddressEnum(dappAddress)).toHex();

        return payload;
    }

    public async getRegisteredDapp(dappAddress: string): Promise<DappInfo | undefined> {
        await this.ensureConnection();
        const dapp = await this._api.query.dappsStaking.registeredDapps<Option<DappInfo>>(
            this.getAddressEnum(dappAddress),
        );

        return dapp.unwrapOrDefault();
    }

    protected async ensureConnection(networkIndex?: number): Promise<ApiPromise> {
        let localApi: ApiPromise;
        const currentIndex = networkIndex ?? 0;

        if (!this._api || networkIndex) {
            const provider = new WsProvider(this.endpoints[currentIndex]);
            localApi = new ApiPromise({ provider });
        } else {
            localApi = this._api;
        }

        return await localApi.isReadyOrError.then(
            (api: ApiPromise) => {
                // Connection suceed
                this._api = api;
                return api;
            },
            async () => {
                // Connection failed.
                localApi.disconnect(); //Stop reconnecting to failed endpoint.
                const nextNetworkIndex = this.getNextNetworkIndex(currentIndex);
                console.warn(
                    `Connection to ${this.endpoints[currentIndex]} failed. Falling back to ${this.endpoints[nextNetworkIndex]}`,
                );

                // Failover to next endpoint.
                return await this.ensureConnection(nextNetworkIndex);
            },
        );
    }

    private getNextNetworkIndex(currentIndex: number): number {
        return (currentIndex + 1) % this.endpoints.length;
    }

    private getErrorMessage(dispatchError: DispatchError): string {
        let message = '';
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

        return message;
    }

    private getAddressEnum(address: string) {
        if (isEthereumAddress(address)) {
            return { Evm: address };
        } else if (this.isValidAddressPolkadotAddress(address)) {
            return { Wasm: address };
        } else {
            throw new Error(`Invalid contract address ${address}. The address should be in EVM or WASM format.`);
        }
    }

    private isValidAddressPolkadotAddress(address: string, prefix?: number): boolean {
        try {
            if (prefix) {
                return checkAddress(address, prefix)[0];
            } else {
                encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));
                return true;
            }
        } catch (error) {
            return false;
        }
    }
}
