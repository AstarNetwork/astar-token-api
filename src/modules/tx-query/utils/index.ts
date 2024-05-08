import { TransferDetails } from './../../../models/TxQuery';
import { formatEther, formatUnits } from 'ethers';
import Web3 from 'web3';
import abiDecoder from 'abi-decoder';
import ERC20_ABI from '../abi/ERC20.json';
import OFT_TOKEN_ZKEVM_ABI from '../abi/OFT_TOKEN_ZKEVM.json';
import { networks } from '../../../networks';
import { layerZeroTokens } from '../oftTokens';

export const createWeb3Instance = (endpoint: string): Web3 => {
    return new Web3(new Web3.providers.HttpProvider(endpoint));
};

const checkIsZkEvm = (chainId: string): boolean => {
    return chainId === networks['astar-zkevm'].evmId || chainId === networks.zkyoto.evmId;
};

const checkIsOftToken = (chainId: string, tokenAddress: string): boolean => {
    const tokens = layerZeroTokens.filter((it) => it.chainId === chainId).map((it) => it.address);
    return tokens.some((it) => it.toLowerCase() === tokenAddress.toLowerCase());
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
    const blockNumber = (tx.blockNumber ?? -1) as number;
    const isSuccess = blockNumber > 0;
    const block = await web3.eth.getBlock(blockNumber);
    const timestamp = block && Number(block.timestamp);
    const from = receipt.from;
    if (isNativeToken) {
        const amount = formatEther(tx.value as string);
        const network = Object.values(networks).find((it) => it.evmId === String(chainId));
        const symbol = network?.token || '';
        const to = tx.to as string;
        return { from, to, symbol, amount, isSuccess, timestamp };
    } else {
        const isZkEvm = checkIsZkEvm(String(chainId));
        const tokenAddress = String(tx.to);
        const isOftToken = isZkEvm && checkIsOftToken(String(chainId), tokenAddress);
        const abi = isOftToken ? OFT_TOKEN_ZKEVM_ABI : ERC20_ABI;
        const contract = new web3.eth.Contract(abi, tx.to as string);
        abiDecoder.addABI(abi);
        const from = receipt.from;

        const [symbol, decimals, txInput] = await Promise.all([
            contract.methods.symbol().call() as unknown as string,
            contract.methods.decimals().call(),
            abiDecoder.decodeMethod(tx.input),
        ]);
        const to = txInput.params[0].value;
        const amt = txInput.params[1].value;
        const amount = formatUnits(amt as string, decimals as unknown as number);
        return { from, to, symbol, amount, isSuccess, timestamp };
    }
};
