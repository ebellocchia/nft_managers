// Project
import { testPaymentERC20AddressSet, testPaymentERC20AddressNullAddress } from "../common/TestPaymentERC20Address";
import { RedeemerTestContext, initRedeemerTestContext } from "./UtilsRedeemer";


describe("NftsRedeemer.PaymentERC20Address", () => {
  let test_ctx: RedeemerTestContext;

  beforeEach(async () => {
    test_ctx = await initRedeemerTestContext();
  });

  it("should set the payment wallet", async () => {
    await testPaymentERC20AddressSet(
      test_ctx.redeemer,
      test_ctx.user_1_address
    );
  });

  it("should revert if setting a payment wallet with null address", async () => {
    await testPaymentERC20AddressNullAddress(
      test_ctx.redeemer
    );
  });
});
