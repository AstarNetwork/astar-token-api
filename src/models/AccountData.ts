import { Struct } from '@polkadot/types';
import { BN } from '@polkadot/util';

export interface AccountData extends Struct {
    free: BN;
    reserved: BN;
    miscFrozen: BN;
    feeFrozen: BN;
    frozen: BN;
    flags: BN;
}
