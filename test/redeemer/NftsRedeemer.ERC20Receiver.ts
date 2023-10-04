import { expect } from "chai";
import { Contract } from "ethers";
// Project
import {
  deployMockERC20ReceiverContract, deployMockERC20ReceiverRetValErrContract, deployMockERC20ReceiverNotImplContract
} from "../common/UtilsCommon";
import { RedeemerTestContext, initRedeemerTestContextAndCreate } from "./UtilsRedeemer";


describe("NftsRedeemer.ERC20Receiver", () => {
  let test_ctx: RedeemerTestContext;

  beforeEach(async () => {
    test_ctx = await initRedeemerTestContextAndCreate();
  });

  it("should call the onERC20Received function if the payment ERC20 address is a contract", async () => {
    const erc20_receiver: Contract = await deployMockERC20ReceiverContract();
    expect(await erc20_receiver.received()).to.equal(false);
  
    await test_ctx.redeemer.setPaymentERC20Address(erc20_receiver.address);
    await test_ctx.redeemer.connect(test_ctx.accounts.signers[0]).redeemToken();

    expect(await erc20_receiver.received()).to.equal(true);
  });

  it("should revert if the onERC20Received function returns the wrong value", async () => {
    const erc20_receiver: Contract = await deployMockERC20ReceiverRetValErrContract();
  
    await test_ctx.redeemer.setPaymentERC20Address(erc20_receiver.address);
    await expect(test_ctx.redeemer.connect(test_ctx.accounts.signers[0]).redeemToken())
      .to.be.revertedWithCustomError(test_ctx.redeemer, "IERC20ReceiverRetValError");
  });

  it("should revert if the onERC20Received function is not implemented", async () => {
    const erc20_receiver: Contract = await deployMockERC20ReceiverNotImplContract();
  
    await test_ctx.redeemer.setPaymentERC20Address(erc20_receiver.address);
    await expect(test_ctx.redeemer.connect(test_ctx.accounts.signers[0]).redeemToken())
      .to.be.revertedWithCustomError(test_ctx.redeemer, "IERC20ReceiverNotImplError");
  });
});
