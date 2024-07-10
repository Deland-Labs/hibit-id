import BigNumber from "bignumber.js";
import { AssetInfo, ChainWallet } from "../types";
import { isAddress, JsonRpcProvider, Contract, HDNodeWallet, parseEther } from "ethers";
import { ChainAssetType, ChainInfo } from "../../../basicTypes";
import { erc20Abi } from "./erc20";

export class EthereumChainWallet extends ChainWallet {
  private provider: JsonRpcProvider
  private wallet: HDNodeWallet

  constructor(chainInfo: ChainInfo, phrase: string) {
    super(chainInfo, phrase)
    this.provider = new JsonRpcProvider(
      this.chainInfo.rpcUrls[0],
      this.chainInfo.chainId.network.value.toNumber()
    )
    this.wallet = HDNodeWallet.fromPhrase(this.phrase)
    this.wallet.connect(this.provider)
  }

  public override getAddress: () => string = () => {
    return this.wallet.address
  }

  public override signMessage: (message: string) => Promise<string> = async (message) => {
    const signature = await this.wallet.signMessage(message)
    return signature
  }

  public override balanceOf = async (address: string, assetInfo: AssetInfo) => {
    if (!isAddress(address)) {
      throw new Error('Ethereum: invalid wallet address');
    }
    // native
    if (assetInfo.chainAssetType.equals(ChainAssetType.Native)) {
      const balance = await this.provider.getBalance(address);
      return new BigNumber(balance.toString()).shiftedBy(-assetInfo.decimalPlaces.value)
    }
    // erc20
    if (assetInfo.chainAssetType.equals(ChainAssetType.ERC20)) {
      const contract = new Contract(assetInfo.contractAddress, erc20Abi, this.provider);
      const getDecimals = contract.decimals();
      const getBalance = contract.balanceOf(address);
      const [decimals, balance] = await Promise.all([getDecimals, getBalance]);
      return new BigNumber(balance.toBigInt()).shiftedBy(-decimals);
    }

    throw new Error(`Ethereum: unsupported chain asset type ${assetInfo.chainAssetType.toString()}`);
  };

  public override transfer = async (toAddress: string, amount: BigNumber, assetInfo: AssetInfo) => {
    if (!isAddress(toAddress)) {
      throw new Error('Ethereum: invalid wallet address');
    }
    // native
    if (assetInfo.chainAssetType.equals(ChainAssetType.Native)) {
      const tx = await this.wallet.sendTransaction({
        to: toAddress,
        value: parseEther(amount.toString())
      });
      return tx.hash;
    }
    // erc20
    if (assetInfo.chainAssetType.equals(ChainAssetType.ERC20)) {
      const token = new Contract(assetInfo.contractAddress, erc20Abi, this.provider);
      const decimals = await token.decimals();
      const tx = await token
        .connect(this.wallet)
        .getFunction('transfer')(toAddress, BigInt(amount.shiftedBy(decimals).toString()));
      return tx.hash;
    }

    throw new Error(`Ethereum: unsupported chain asset type ${assetInfo.chainAssetType.toString()}`);
  }
}
