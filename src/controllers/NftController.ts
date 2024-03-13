import express, { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { ControllerBase } from './ControllerBase';
import { IControllerBase } from './IControllerBase';
import { ContainerTypes } from '../containertypes';
import { INftService } from '../services/NftService';
import { NetworkType } from '../networks';

@injectable()
export class NftController extends ControllerBase implements IControllerBase {
    constructor(@inject(ContainerTypes.BluezNftService) private nftService: INftService) {
        super();
    }

    public register(app: express.Application): void {
        app.route('/api/v1/:network/nft/owned/:owner').get(async (req: Request, res: Response) => {
            try {
                const network = req.params.network as NetworkType;
                const owner = req.params.owner;
                const currentPage = req.query.page as string;
                const pageSize = req.query.pageSize as string;
                res.json(await this.nftService.getOwnedTokens(network, owner, currentPage, pageSize));
            } catch (err) {
                this.handleError(res, err as Error);
            }
        });

        app.route('/api/v1/:network/nft/metadata/:contractAddress/:tokenId').get(
            async (req: Request, res: Response) => {
                try {
                    const network = req.params.network as NetworkType;
                    const contractAddress = req.params.contractAddress;
                    const tokenId = req.params.tokenId;
                    res.json(await this.nftService.getNftMetadata(network, contractAddress, tokenId));
                } catch (err) {
                    this.handleError(res, err as Error);
                }
            },
        );
    }
}
