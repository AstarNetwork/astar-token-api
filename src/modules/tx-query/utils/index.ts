import { TransferDetails } from './../../../models/TxQuery';
import { ethers } from 'ethers';
import Web3 from 'web3';
import abiDecoder from 'abi-decoder';
import ABI from '../abi/ERC20.json';
import { AbiItem } from 'web3-utils';
import { networks } from '../../../networks';

export const createWeb3Instance = (endpoint: string): Web3 => {
    return new Web3(new Web3.providers.HttpProvider(endpoint));
};

export const fetchEvmTransferDetails = async ({
    hash,
    web3,
}: {
    hash: string;
    web3: Web3;
}): Promise<TransferDetails> => {
    const [receipt, tx, chainId] = await Promise.all([
        web3.eth.getTransactionReceipt(hash),
        web3.eth.getTransaction(hash),
        web3.eth.getChainId(),
    ]);
    const isNativeToken = tx.input === '0x';
    const blockNumber = tx.blockNumber as number;
    const isSuccess = blockNumber > 0;
    const block = await web3.eth.getBlock(blockNumber);
    const timestamp = block && (block.timestamp as number);
    const from = receipt.from;
    if (isNativeToken) {
        const amount = ethers.utils.formatEther(tx.value as string);
        const network = Object.values(networks).find((it) => it.evmId === String(chainId));
        const symbol = network?.token || '';
        const to = tx.to as string;
        return { from, to, symbol, amount, isSuccess, timestamp };
    } else {
        const contract = new web3.eth.Contract(ABI as AbiItem[], tx.to as string);
        abiDecoder.addABI(ABI);
        const from = receipt.from;
        const [symbol, decimals, txInput] = await Promise.all([
            contract.methods.symbol().call(),
            contract.methods.decimals().call(),
            abiDecoder.decodeMethod(tx.input),
        ]);
        const to = txInput.params[0].value;
        const amt = txInput.params[1].value;
        const amount = ethers.utils.formatUnits(amt as string, decimals);
        return { from, to, symbol, amount, isSuccess, timestamp };
    }
};
