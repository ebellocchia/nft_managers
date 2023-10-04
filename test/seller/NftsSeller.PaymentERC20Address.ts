// Project
import { testPaymentERC20AddressSet, testPaymentERC20AddressNullAddress } from "../common/TestPaymentERC20Address";
import { SellerTestContext, initSellerTestContext } from "./UtilsSeller";


describe("NftsSeller.PaymentERC20Address", () => {
  let test_ctx: SellerTestContext;

  beforeEach(async () => {
    test_ctx = await initSellerTestContext();
  });

  it("should set the payment wallet", async () => {
    await testPaymentERC20AddressSet(
      test_ctx.seller,
      test_ctx.user_1_address
    );
  });

  it("should revert if setting a payment wallet with null address", async () => {
    await testPaymentERC20AddressNullAddress(
      test_ctx.seller
    );
  });
});
