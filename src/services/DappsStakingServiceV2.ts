import { inject, injectable } from "inversify";
import { IApiFactory } from "../client/ApiFactory";
import { ContainerTypes } from "../containertypes";
import { DappItem, NewDappItem } from "../models/Dapp";
import { NetworkType } from "../networks";
import { DappsStakingService, IDappsStakingService } from "./DappsStakingService";
import { IFirebaseService } from "./FirebaseService";

@injectable()
export class DappsStakingServiceV2 extends DappsStakingService implements IDappsStakingService {
  constructor(
    @inject(ContainerTypes.ApiFactory) _apiFactory: IApiFactory,
    @inject(ContainerTypes.FirebaseService) _firebase: IFirebaseService,
  ) {
    super(_apiFactory, _firebase);
  }

  /**
     * Registers dapp by writing dapp info to Firebase.
     * @param dapp The dapp instance which contains signed transaction
     * @param network The network to use.
     * @returns Registered dapp instance
     */
  public async registerDapp(dapp: NewDappItem, network: NetworkType = 'astar'): Promise<DappItem> {
    return Promise.resolve({} as DappItem);
  }
}