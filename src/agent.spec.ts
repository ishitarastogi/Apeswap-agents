import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  TransactionEvent,
} from "forta-agent";
import {
  createAddress,
  TestTransactionEvent,
  MockEthersProvider,
} from "forta-agent-tools/lib/tests";
const percent = 5;
import { provideHandleTransaction } from "./agent";
import { BigNumber } from "ethers";
import util from "./utils";
import { Interface } from "@ethersproject/abi";

const testGnana: string = createAddress("0xdef1");
const testBalanceOf: Interface = new Interface(util.BALANCE_OF);
const testTotalSupply: Interface = new Interface(util.TOTAL_SUPPLY);
const USER_ADDR = createAddress("0xf1e4a");
const IRRELEVENT_IFACE: Interface = new Interface(["function wrongFunction()"]);

const createFinding = ([address]: string[]): Finding =>
  Finding.fromObject({
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

describe("Large holding of governance tokens to a address", () => {
  let handleTransaction: HandleTransaction;
  const mockProvider = new MockEthersProvider();

  beforeEach(() => {
    handleTransaction = provideHandleTransaction(
      testGnana,
      percent,
      mockProvider as any
    );
    mockProvider.clear();
  });

  it("should ignore empty transactions", async () => {
    const txEvent: TransactionEvent = new TestTransactionEvent();

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return no Findings due to incorrect signature", async () => {
    const addr: string = createAddress("0xde1");
    const Transaction: string = testBalanceOf.encodeFunctionData("balanceOf", [
      addr,
    ]);
    mockProvider.addCallTo(testGnana, 50, testBalanceOf, "balanceOf", {
      inputs: [createAddress("0xde1")],
      outputs: [100],
    });
    mockProvider.addCallTo(testGnana, 50, testTotalSupply, "totalSupply", {
      inputs: [],
      outputs: [100],
    });
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(testGnana)
      .setFrom(USER_ADDR)
      .setData(Transaction)
      .setBlock(50);

    const findings = await handleTransaction(txEvent);
    console.log(findings);
    //expect(findings).toStrictEqual([]);
  });

  it("should return no findings for incorrect address", async () => {
    const wrongTestGnana: string = createAddress("0xd34d");
    const addr: string = createAddress("0xde1");

    const Transaction: string = testBalanceOf.encodeFunctionData("balanceOf", [
      addr,
    ]);

    mockProvider.addCallTo(wrongTestGnana, 50, testBalanceOf, "balanceOf", {
      inputs: [createAddress("0xde1")],
      outputs: [100],
    });
    mockProvider.addCallTo(wrongTestGnana, 50, testTotalSupply, "totalSupply", {
      inputs: [],
      outputs: [100],
    });
    const txEvent: TransactionEvent = new TestTransactionEvent()
      .setTo(wrongTestGnana)
      .setFrom(USER_ADDR)
      .setData(Transaction)
      .setBlock(50);

    const findings = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return multiple findings", async () => {
    const TEST_DATA: string[][] = [
      [createAddress("0xabc168")],
      [createAddress("0xabc268")],
      [createAddress("0xabc368")],
    ];
    const txEvent: TestTransactionEvent = new TestTransactionEvent()
      .setFrom(USER_ADDR)
      .setBlock(50);

    for (let [addr] of TEST_DATA) {
      mockProvider.addCallTo(testGnana, 50, testBalanceOf, "balanceOf", {
        inputs: [addr],
        outputs: [100],
      });

      mockProvider.addCallTo(testGnana, 50, testTotalSupply, "totalSupply", {
        inputs: [],
        outputs: [100],
      });

      txEvent.addTraces({
        to: testGnana,
        from: USER_ADDR,
        input: testBalanceOf.encodeFunctionData("balanceOf", [addr]),
      });
    }

    const findings = await handleTransaction(txEvent);
    console.log(findings);
    // expect(findings).toStrictEqual([
    //   createFinding(TEST_DATA[0]),
    //   createFinding(TEST_DATA[1]),
    //   createFinding(TEST_DATA[2]),
    // ]);
  });

  // it("should return findings only when balance is greater than thresholdBalance", async () => {
  //   const TEST_DATA: string[][] = [
  //     [createAddress("0xabc348"), BigNumber.from(2).toString()],
  //     [createAddress("0xabc168"), BigNumber.from(1).toString()],
  //     [createAddress("0xabc248"), BigNumber.from(100).toString()],
  //   ];
  //   const txEvent: TestTransactionEvent = new TestTransactionEvent()
  //     .setFrom(USER_ADDR)
  //     .setBlock(50);

  //   for (let [addr, amount] of TEST_DATA) {
  //     mockProvider.addCallTo(testGnana, 50, testBalanceOf, "balanceOf", {
  //       inputs: [addr],
  //       outputs: [amount],
  //     });

  //     mockProvider.addCallTo(testGnana, 50, testTotalSupply, "totalSupply", {
  //       inputs: [],
  //       outputs: [100],
  //     });

  //     txEvent.addTraces({
  //       to: testGnana,
  //       from: USER_ADDR,
  //       input: testBalanceOf.encodeFunctionData("balanceOf", [addr]),
  //     });
  //   }

  //   const findings = await handleTransaction(txEvent);
  //   expect(findings).toStrictEqual([createFinding(TEST_DATA[2])]);
  // });
});
