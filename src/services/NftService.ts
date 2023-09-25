import { injectable } from 'inversify';
import { NftMetadata, NftResponse } from '../models/Nft';
import axios from 'axios';
import * as functions from 'firebase-functions';
import { NetworkType } from '../networks';
import { Guard } from '../guard';

const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_PAGE = 1;

export interface INftService {
    getOwnedTokens(
        network: NetworkType,
        ownerAddress: string,
        currentPage?: string,
        pageSize?: string,
    ): Promise<NftResponse[]>;
    getNftMetadata(network: NetworkType, contractAddress: string, tokenId: string): Promise<NftMetadata | undefined>;
}

@injectable()
export class BluezNftService implements INftService {
    public async getOwnedTokens(
        network: NetworkType,
        ownerAddress: string,
        currentPage?: string,
        pageSize?: string,
    ): Promise<NftResponse[]> {
        this.throwIfNetworkIsNotSupported(network);
        Guard.ThrowIfUndefined(ownerAddress, 'ownerAddress');

        const ownedTokensUrl = `${this.getBaseUri(network)}/getNFTsForOwner?owner=${ownerAddress}&pageKey=${
            currentPage ?? DEFAULT_PAGE
        }&pageSize=${pageSize ?? DEFAULT_PAGE_SIZE}`;
        const result = await axios.get(ownedTokensUrl);

        return result.data;
    }

    public async getNftMetadata(
        network: NetworkType,
        contractAddress: string,
        tokenId: string,
    ): Promise<NftMetadata | undefined> {
        this.throwIfNetworkIsNotSupported(network);
        Guard.ThrowIfUndefined(contractAddress, 'contractAddress');
        Guard.ThrowIfUndefined(tokenId, 'tokenId');

        const metadataUri = `${this.getBaseUri(
            network,
        )}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`;
        const result = await axios.get(metadataUri);

        return result.data ?? undefined;
    }

    private throwIfNetworkIsNotSupported(network: NetworkType): void {
        if (network !== 'astar' && network !== 'shibuya') {
            throw new Error(`Network ${network} is not supported.`);
        }
    }

    private getBaseUri(network: NetworkType): string {
        switch (network) {
            case 'astar':
                return `https://api.bluez.app/api/nft/v3/${String(functions.config().bluez.apikeyastar)}`;
            case 'shibuya':
                return `https://apidev.bluez.app/api/nft/v3/${String(functions.config().bluez.apikeyshibuya)}`;
            default:
                // Bluez doesn't support shiden ATM.
                throw new Error(`Network ${network} is not supported.`);
        }
    }
}
