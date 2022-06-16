import { ApiPromise, WsProvider } from '@polkadot/api';
import { u32, u128, Option, Struct } from '@polkadot/types';
import { PalletBalancesAccountData } from '@polkadot/types/lookup';
import { Header, AccountId } from '@polkadot/types/interfaces';
import BN from 'bn.js';
import { AprCalculationData } from '../models/AprCalculationData';
import { networks } from '../networks';
import { EraRewardAndStake } from '../types/DappsStaking';

interface DappInfo extends Struct {
    developer: AccountId;
}

export interface IAstarApi {
    getTotalSupply(): Promise<u128>;
    getBalances(addresses: string[]): Promise<PalletBalancesAccountData[]>;
    getChainDecimals(): Promise<number>;
    getAprCalculationData(): Promise<AprCalculationData>;
    getTvl(): Promise<BN>;
    getChainName(): Promise<string>;
    getRegisterDappPayload(dappAdress: string): Promise<string>;
    getPreapprovedDevelopers(): Promise<Map<string, string>>;
    getRegisteredDapps(): Promise<Map<string, string>>;
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

    public async getRegisterDappPayload(dappAdress: string): Promise<string> {
        await this.connect();

        const payload = this._api.tx.dappsStaking.register(this.getAddressEnum(dappAdress)).toHex();

        return payload;
    }

    public async getPreapprovedDevelopers(): Promise<Map<string, string>> {
        await this.connect();

        const result = new Map<string, string>();
        const devs = await this._api.query.dappsStaking.preApprovedDevelopers.entries();
        devs.forEach((item) => {
            const keyStr = item[0].toHuman()?.toString();

            if (keyStr) {
                result.set(keyStr, '');
            }
        });

        return result;
    }

    /**
     * Gets map of registered developers and their dapps.
     */
    public async getRegisteredDapps(): Promise<Map<string, string>> {
        await this.connect();

        const result = new Map<string, string>();
        const dapps = await this._api.query.dappsStaking.getRegisteredDapps.entries();

        dapps.forEach((item) => {
            const dappAddres = item[0].toHuman()?.toString();
            const developerAddress = (<DappInfo>item[1]).developer.toString();
        });

        return result;
    }

    private getAddressEnum(address: string) {
        return { Evm: address };
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
