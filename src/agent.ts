import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getEthersProvider,
  ethers,
  HandleTransaction,
} from "forta-agent";
import { providers, BigNumber } from "ethers";
import LRU from "lru-cache";
import util from "./utils";

const PERCENT: number = 5;
const GNANAToken: string = "0xddb3bd8645775f59496c821e4f55a7ea6a6dc299";

export const createFinding = (address: string): Finding => {
  return Finding.fromObject({
    name: "Large holding of balance",
    description: "Large holding of governance tokens",
    alertId: "APESWAP-4",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "APESWAP",
    metadata: {
      address: address.toLowerCase(),
    },
  });
};

export function provideHandleTransaction(
  gnanaToken: string,
  percent: number,
  provider: providers.Provider
): HandleTransaction {
  const cache: LRU<string, BigNumber> = new LRU<string, BigNumber>({
    max: 10000,
  });
  const cache1: LRU<number, BigNumber> = new LRU<number, BigNumber>({
    max: 10000,
  });
  const gnanaContractBalance = new ethers.Contract(
    gnanaToken,
    util.BALANCE_OF,
    provider
  );
  const gnanaContractSupply = new ethers.Contract(
    gnanaToken,
    util.TOTAL_SUPPLY,
    provider
  );

  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const balanceOfFun = txEvent.filterFunction(util.BALANCE_OF, gnanaToken);

    await Promise.all(
      balanceOfFun.map(async (func) => {
        const address = func.args.account;
        const blockNumber: number = txEvent.blockNumber;
        const key: string = `${address}-${blockNumber}`;
        let accountBalance: BigNumber;
        if (cache.has(key)) {
          accountBalance = cache.get(key) as BigNumber;
        } else {
          accountBalance = await gnanaContractBalance.balanceOf(address, {
            blockTag: txEvent.blockNumber,
          });
          cache.set(key, accountBalance);
        }

        let totalSupply: BigNumber;
        const Key1: number = blockNumber;

        if (cache1.has(Key1)) {
          totalSupply = cache1.get(Key1) as BigNumber;
        } else {
          totalSupply = await gnanaContractSupply.totalSupply({
            blockTag: txEvent.blockNumber,
          });
          cache1.set(Key1, totalSupply);
        }
        const thresholdBalance: BigNumber = BigNumber.from(percent)
          .mul(totalSupply)
          .div(100);
        if (accountBalance.gt(thresholdBalance)) {
          findings.push(createFinding(address));
        }
      })
    );

    return findings;
  };
}

export default {
  handleTransaction: provideHandleTransaction(
    GNANAToken,
    PERCENT,
    getEthersProvider()
  ),
};
