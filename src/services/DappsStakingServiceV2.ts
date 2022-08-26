import { cryptoWaitReady, decodeAddress, signatureVerify } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
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
    @inject(ContainerTypes.ApiFactory) apiFactory: IApiFactory,
    @inject(ContainerTypes.FirebaseService) firebase: IFirebaseService,
  ) {
    super(apiFactory, firebase);
  }

  /**
     * Registers dapp by writing dapp info to Firebase.
     * @param dapp The dapp instance which contains signed transaction
     * @param network The network to use.
     * @returns Registered dapp instance
     */
  public async registerDapp(dapp: NewDappItem, network: NetworkType = 'astar'): Promise<DappItem> {
    const isValidRequest = await this.validateRegistrationRequest(dapp.signature, dapp.senderAddress, dapp.address, network);
    return Promise.resolve({} as DappItem);
  }

  /**
     * Validates dapp registration request taking into account the following criteria:
     *  - Sender signature is valid
     *  - senderAddress is whitelisted for dapp staking
     *  - sender didn't register dapp before
     * @param signature Requester signature.
     * @param senderAddress Requester address.
     * @param dappAddress Dapp address.
     */
   protected async validateRegistrationRequest(
    signature: string,
    senderAddress: string,
    dappAddress: string,
    network: NetworkType,
  ): Promise<boolean> {
      const api = this.apiFactory.getApiInstance(network);

      // Check signature
      const signedMessage = await api.getRegisterDappPayload(dappAddress);
      const isValidSignature = await this.isValidSignature(signedMessage, signature, senderAddress);
      console.log(isValidSignature);

      return isValidSignature;
      // if (isValidSignature) {
      //     // Check if sender is preapproved developer
      //     const api = this.apiFactory.getApiInstance(network);
      //     const preapprovedDevelopers = await api.getPreapprovedDevelopers();

      //     if (preapprovedDevelopers.has(senderAddress)) {
      //         // Check if developer has already registered dapp.
      //         const registeredDapps = await api.getRegisteredDapps();

      //         if (!registeredDapps.has(dappAddress)) {
      //             return true;
      //         }
      //     }
      // }

      // return false;
  }

  /**
     * Validates user signature.
     * @param signedMessage Message signed by a signer.
     * @param signature Signed message.
     * @param signerAddress Signer address.
     */
   protected async isValidSignature(
    signedMessage: string,
    signature: string,
    signerAddress: string,
  ): Promise<boolean> {
      await cryptoWaitReady();

      const publicKey = decodeAddress(signerAddress);
      const hexPublicKey = u8aToHex(publicKey);

      return signatureVerify(signedMessage, signature, hexPublicKey).isValid;
  }
}