import { injectable } from 'inversify';
import { UserEvent } from '../../models/DappStaking';
import { DappStakingCallData } from './ResponseData';
import { CallNameMapping } from './CallNameMapping';

export interface ICallParser {
    parse(call: DappStakingCallData): UserEvent;
}

@injectable()
export class CallParser implements ICallParser {
    public parse(call: DappStakingCallData): UserEvent {
        return {
            timestamp: new Date(call.timestamp).getTime(),
            transaction: CallNameMapping[call.callName],
            transactionHash: call.extrinsicHash,
            transactionSuccess: call.success,
        };
    }
}

@injectable()
export class BondAndStakeParser extends CallParser implements ICallParser {
    public parse(call: DappStakingCallData): UserEvent {
        const result = super.parse(call);
        result.contractAddress = call.argsStr[1];
        result.amount = call.argsStr[2];

        return result;
    }
}

@injectable()
export class UnbondAndUnstakeParser extends CallParser implements ICallParser {
    public parse(call: DappStakingCallData): UserEvent {
        const result = super.parse(call);
        result.contractAddress = call.argsStr[1];
        result.amount = call.argsStr[2];

        return result;
    }
}

@injectable()
export class NominationTransferParser extends CallParser implements ICallParser {
    public parse(call: DappStakingCallData): UserEvent {
        const result = super.parse(call);
        result.contractAddress = call.argsStr[2];
        result.amount = call.argsStr[3];

        return result;
    }
}

@injectable()
export class WithdrawParser extends CallParser implements ICallParser {
    public parse(call: DappStakingCallData): UserEvent {
        const result = super.parse(call);

        return result;
    }
}

@injectable()
export class WithdrawFromUnbondedParser extends CallParser implements ICallParser {
    public parse(call: DappStakingCallData): UserEvent {
        const result = super.parse(call);

        return result;
    }
}

// Parses Reward events from a batch call and calculates total rewards per batch.
@injectable()
export class BatchCallParser extends CallParser implements ICallParser {
    public parse(call: DappStakingCallData): UserEvent {
        const EVENT_NAME = 'Reward';
        const PALLET_NAME = 'DappsStaking';

        let reward = BigInt(0);
        for (const event of call.extrinsic.events) {
            if (event.eventName === EVENT_NAME && event.palletName === PALLET_NAME) {
                reward += BigInt(event.argsStr[4]);
            }
        }

        // If reward is 0 this means that batch call was not claim call and we should not return it.
        if (reward === BigInt(0)) {
            throw new Error("Batch doesn't contain claim calls");
        }

        return {
            timestamp: new Date(call.timestamp).getTime(),
            transaction: EVENT_NAME,
            transactionHash: call.extrinsicHash,
            transactionSuccess: call.success,
            amount: reward.toString(),
        };
    }
}
