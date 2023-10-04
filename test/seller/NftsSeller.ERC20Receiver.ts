import { expect } from "chai";
import { Contract } from "ethers";
// Project
import {
  deployMockERC20ReceiverContract, deployMockERC20ReceiverRetValErrContract, deployMockERC20ReceiverNotImplContract
} from "../common/UtilsCommon";
import { SellerTestContext, initSellerTestContextAndCreate } from "./UtilsSeller";


describe("NftsSeller.ERC20Receiver", () => {
  let test_ctx: SellerTestContext;

  beforeEach(async () => {
    test_ctx = await initSellerTestContextAndCreate();
  });

  it("should call the onERC20Received function if the payment ERC20 address is a contract", async () => {
    const erc20_receiver: Contract = await deployMockERC20ReceiverContract();
    expect(await erc20_receiver.received()).to.equal(false);
  
    await test_ctx.seller.setPaymentERC20Address(erc20_receiver.address);
    await test_ctx.seller.connect(test_ctx.accounts.signers[0]).buyERC721(
      test_ctx.mock_erc721.address,
      0
    );

    expect(await erc20_receiver.received()).to.equal(true);
  });

  it("should revert if the onERC20Received function returns the wrong value", async () => {
    const erc20_receiver: Contract = await deployMockERC20ReceiverRetValErrContract();
  
    await test_ctx.seller.setPaymentERC20Address(erc20_receiver.address);
    await expect(test_ctx.seller.connect(test_ctx.accounts.signers[0]).buyERC721(
      test_ctx.mock_erc721.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "IERC20ReceiverRetValError");
  });

  it("should revert if the onERC20Received function is not implemented", async () => {
    const erc20_receiver: Contract = await deployMockERC20ReceiverNotImplContract();
  
    await test_ctx.seller.setPaymentERC20Address(erc20_receiver.address);
    await expect(test_ctx.seller.connect(test_ctx.accounts.signers[0]).buyERC721(
      test_ctx.mock_erc721.address,
      0
    ))
      .to.be.revertedWithCustomError(test_ctx.seller, "IERC20ReceiverNotImplError");
  });
});
