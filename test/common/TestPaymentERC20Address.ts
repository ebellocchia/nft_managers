import { expect } from "chai";
import { Contract } from "ethers";
// Project
import * as constants from "./Constants";


//
// Exported functions
//

export async function testPaymentERC20AddressSet(
  manager: Contract,
  paymentERC20Address: string
) : Promise<void> {
  const old_address: string = await manager.paymentERC20Address();
  await expect(await manager.setPaymentERC20Address(paymentERC20Address))
    .to.emit(manager, "PaymentERC20AddressChanged")
    .withArgs(old_address, paymentERC20Address);
  expect(await manager.paymentERC20Address())
    .to.equal(paymentERC20Address);
}

export async function testPaymentERC20AddressNullAddress(
  manager: Contract
) : Promise<void> {
  await expect(manager.setPaymentERC20Address(constants.NULL_ADDRESS))
    .to.be.revertedWithCustomError(manager, "NullAddressError");
}
