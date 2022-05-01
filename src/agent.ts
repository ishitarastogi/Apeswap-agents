import {
  BlockEvent,
  Finding,
  TransactionEvent,
  getEthersProvider,
  HandleTransaction,
  HandleBlock,
  LogDescription,
} from "forta-agent";
import { BigNumber } from "ethers";
import DataFetcher from "./data.fetcher";
import {
  GNANA_TOKEN_CONTRACT,
  EVENT_ABI,
  createLargeBalanceFinding,
  BALANCE_THRESHOLD,
} from "./utils";
const FETCHER: DataFetcher = new DataFetcher(
  GNANA_TOKEN_CONTRACT,
  getEthersProvider()
);
let accounts: string[] = [];


export const provideHandleTransaction =
  (fetcher: DataFetcher,    
    accounts: string[]
    ): HandleTransaction =>
  async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];
    const logs: LogDescription[] = txEvent.filterLog(
      EVENT_ABI,
      fetcher.gnanaTokenAddress
    );

    for (const log of logs) {
      const toAddress = log.args.to;
      accounts.push(toAddress);
    }

    return findings;
  };
  export const provideHandleBlock = (
    fetcher: DataFetcher,
    balanceThreshold: BigNumber,
    accounts: string[]
  ): HandleBlock => {
    return async (blockEvent: BlockEvent): Promise<Finding[]> => {
      const findings: Finding[] = [];
      for(let addr = 0; addr < accounts.length; addr++) {
        const balance: BigNumber= await fetcher.getBalance(accounts[addr], blockEvent.blockNumber);
        if (balance.gt(balanceThreshold)) {
          findings.push(createLargeBalanceFinding(accounts[addr], balance));
        }
      }
      return findings;
    };
  };
export default {
  handleTransaction: provideHandleTransaction(FETCHER,accounts),
  handleBlock: provideHandleBlock(FETCHER, BALANCE_THRESHOLD,accounts),

};
