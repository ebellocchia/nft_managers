// Project
import { testPaymentERC20AddressSet, testPaymentERC20AddressNullAddress } from "../common/TestPaymentERC20Address";
import { AuctionTestContext, initAuctionTestContext } from "./UtilsAuction";


describe("NftsAuction.PaymentERC20Address", () => {
  let test_ctx: AuctionTestContext;

  beforeEach(async () => {
    test_ctx = await initAuctionTestContext();
  });

  it("should set the payment wallet", async () => {
    await testPaymentERC20AddressSet(
      test_ctx.auction,
      test_ctx.user_1_address
    );
  });

  it("should revert if setting a payment wallet with null address", async () => {
    await testPaymentERC20AddressNullAddress(
      test_ctx.auction
    );
  });
});
