import { Finding, HandleBlock, BlockEvent } from "forta-agent";
import { Interface } from "ethers/lib/utils";
import { provideHandleBlock } from "./agent";
import {
  createAddress,
  TestBlockEvent,
  MockEthersProvider,
} from "forta-agent-tools/lib/tests";
import { when } from "jest-when";
import { createLargeBalanceFinding, EVENT_ABI } from "./utils";
import { BigNumber, utils } from "ethers";

const TEST_GNANA_TOKEN_CONTRACT = createAddress("0xa1");
const TEST_GNANA_IFACE = new Interface(EVENT_ABI);
const IRRELEVANT_EVENT_IFACE = new Interface([
  "event IrrelevantEvent(address indexed from, address indexed to, uint256 amount)",
]);

const mockFetcher = {
  getBalance: jest.fn(),
  gnanaTokenAddress: TEST_GNANA_TOKEN_CONTRACT,
};

const testTransferAmounts: BigNumber[] = [
  BigNumber.from("2000000000000000000"),
  BigNumber.from("3000000000000000000"),
  BigNumber.from("30000"),
];

const testBalances: BigNumber[] = [
  BigNumber.from("300000000000000000000000000"), //above threshold
  BigNumber.from("80000000000000000000000000"), //above threshold
  BigNumber.from("30000"), //below threshold
];

const testBlock: number = 19214517;
const testAccounts: string[] = [
  createAddress("0x1"),
  createAddress("0x2"),
  createAddress("0x3"),
];

describe("Golden Banana(GNANA) Large Balance Tests", () => {
  let handleBlock: HandleBlock;
  const mockProvider = new MockEthersProvider();

  const balanceThreshold = BigNumber.from("3000000000")
    .mul(`${10 ** 18}`)
    .mul(1)
    .div(100);
  const testAddr: Set<string> = new Set<string>();

  beforeEach(() => {
    mockFetcher.getBalance.mockClear();
    mockProvider.clear();

    handleBlock = provideHandleBlock(
      mockFetcher as any,
      balanceThreshold,
      testAddr,
      mockProvider as any
    );
  });

  it("should return a finding ", async () => {
    const blockHash =
      "0x2d72d415ab86cadfb2222aa6e20c1eead908602f9469576b3cd848e5588a52fb";
    const address = "0x2449E7940B0Df3426981945431AA9dc95b982702";
    const topics = [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000000db723d5863a9b33ad83aa349b27f8136b6d5360",
      "0x000000000000000000000000cffcb4c9d94524e4609ffef60c47daf8fc38ae1b",
    ];
    const fromBlock = 19243883;
    const toBlock = 234;
    const filter = { address, topics, blockHash };
    const logs = [
      {
        blockNumber: 19243883,
        blockHash:
          "0x2d72d415ab86cadfb2222aa6e20c1eead908602f9469576b3cd848e5588a52fb",
        transactionIndex: 4,
        removed: false,
        address: "0x2449E7940B0Df3426981945431AA9dc95b982702",
        data: "0x000000000000000000000000000000000000000000f330ebef7f58e6e6000000",
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0x0000000000000000000000000db723d5863a9b33ad83aa349b27f8136b6d5360",
          "0x000000000000000000000000cffcb4c9d94524e4609ffef60c47daf8fc38ae1b",
        ],
        transactionHash:
          "0x0d1229486bb800cc835e60054466b1ef80df6167bd5414ac2ee340b3ad66fb40",
        logIndex: 8,
      },
    ];

    mockProvider.addFilteredLogs(filter, logs);

    when(mockFetcher.getBalance)
      .calledWith(testAccounts[0], testBlock)
      .mockReturnValue(testBalances[0]);
    const blockEvent: BlockEvent = new TestBlockEvent().setHash(blockHash);

    const findings: Finding[] = await handleBlock(blockEvent);
    console.log(findings);
  });
});
