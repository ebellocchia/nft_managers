# NFT Managers
[![Build](https://github.com/ebellocchia/nft_managers/actions/workflows/build.yml/badge.svg)](https://github.com/ebellocchia/nft_managers/actions/workflows/build.yml)
[![Test](https://github.com/ebellocchia/nft_managers/actions/workflows/test.yml/badge.svg)](https://github.com/ebellocchia/nft_managers/actions/workflows/test.yml)

## Introduction

The package contains 3 smart contracts:

- `NftsAuction`: it allows to auction ERC721 or ERC1155 tokens by paying in ERC20 tokens (e.g. stablecoins)
- `NftsSeller`: it allows to sell ERC721 or ERC1155 tokens by paying in ERC20 tokens (e.g. stablecoins)
- `NftsRedeemer`: it allows to reserve a ERC721 or ERC1155 token for a specific wallet, which can redeem it by paying in ERC20 tokens (e.g. stablecoins)

Each smart contract is upgradeable using a UUPS proxy, so it's deployed together with a `ERC1967Proxy` proxy contract.

## Setup

Install `yarn` if not installed:

    npm install -g yarn

### Install package

Simply run:

    npm i --include=dev

### Compile

- To compile the contract:

        yarn compile

- To compile by starting from a clean build:

        yarn recompile

### Run tests

- To run tests without coverage:

        yarn test

- To run tests with coverage:

        yarn coverage

### Deploy

- To deploy all contracts:

        yarn deploy-all <NETWORK> --wallet-addr <WALLET_ADDRESS>

- To deploy the `NftsAuction` contract:

        yarn deploy-auction <NETWORK> --wallet-addr <WALLET_ADDRESS>

- To deploy the `NftsRedeemer` contract:

        yarn deploy-redeemer <NETWORK> --wallet-addr <WALLET_ADDRESS>

- To deploy the `NftsSeller` contract:

        yarn deploy-seller <NETWORK> --wallet-addr <WALLET_ADDRESS>

- To upgrade the `NftsAuction` contract:

        yarn upgrade-auction-to <NETWORK> --proxy-addr <PROXY_ADDRESS>

- To upgrade the `NftsRedeemer` contract:

        yarn upgrade-redeemer-to <NETWORK> --proxy-addr <PROXY_ADDRESS>

- To upgrade the `NftsSeller` contract:

        yarn upgrade-seller-to <NETWORK> --proxy-addr <PROXY_ADDRESS>

- To deploy the test tokens (i.e. `MockERC20Token`,  `MockERC721Token`,  `MockERC1155Token`):

        yarn deploy-test-tokens <NETWORK> --erc20-supply <ERC20_SUPPLY>

### Configuration

Hardhat is configured with the following networks:

|Network name|Description|
|---|---|
|`hardhat`|Hardhat built-in network|
|`locahost`|Localhost network (address: `127.0.0.1:8545`, it can be run with the following command: `yarn run-node`)|
|`bscTestnet`|Zero address|
|`bsc`|BSC mainnet|
|`ethereumSepolia`|ETH testnet (Sepolia)|
|`ethereum`|ETH mainnet|
|`polygonMumbai`|Polygon testnet (Mumbai)|
|`polygon`|Polygon mainnet|

The API keys, RPC nodes and mnemonic shall be configured in the `.env` file.\
You may need to modify the gas limit and price in the Hardhat configuration file for some networks (e.g. Polygon), to successfully execute the transactions (you'll get a gas error).

## Functions

### Common functions

Functions implemented by all contracts.

___

    function init(
        address paymentERC20Address_
    ) initializer

Initialize the contract with the specified address for receiving ERC20 tokens.\
The function is an `initializer`, so it can be called only once.

The function is usually called by the `ERC1967Proxy` that manages the contract.

___

    function setPaymentERC20Address(
        address paymentERC20Address_
    ) onlyOwner

Set the address where the ERC20 tokens paid by users will be transferred.\
If the address is a contract, the function:

    function onERC20Received(
        IERC20 token_,
        uint256 amount_
    ) returns (bytes4)

will be automatically called on the contract to manage the received tokens.
On success, the function shall return its Solidity selector (i.e. `IERC20Receiver.onERC20Received.selector`).\
In order to implement the function, the contract should derive the `IERC20Receiver` interface and override it.

The function can be only called by the owner.

### "NftsSeller" functions

    function createERC721Sale(
        IERC721 nftContract_,
        uint256 nftId_,
        IERC20 erc20Contract_,
        uint256 erc20Amount_
    ) onlyOwner

Create a sale for a ERC721 token with address `nftContract_` and ID `nftId_`. The token shall be owned by the contract.\
The price of the token is `erc20Amount_` of the ERC20 token with address `erc20Contract_`.

The function can be only called by the owner.

___

    function createERC1155Sale(
        IERC1155 nftContract_,
        uint256 nftId_,
        uint256 nftAmount_,
        IERC20 erc20Contract_,
        uint256 erc20Amount_
    ) onlyOwner

Create a sale for a ERC1155 token with address `nftContract_`, ID `nftId_` and amount `nftAmount_`. The token shall be owned by the contract.\
The price of the token is `erc20Amount_` of the ERC20 token with address `erc20Contract_`.

The function can be only called by the owner.

___

    function removeSale(
        address nftContract_,
        uint256 nftId_
    ) onlyOwner

Remove the sale of the token (ERC721 or ERC1155) with address `nftContract_` and ID `nftId_`.

The function can be only called by the owner.

___

    function withdrawERC721(
        IERC721 nftContract_,
        uint256 nftId_
    ) onlyOwner

Withdraw the ERC721 token with address `nftContract_` and ID `nftId_`, transferring it to the contract owner.\
The token shall not be for sale at that moment. In case it is, it shall be removed before calling the function.

The function can be only called by the owner.

___

    function withdrawERC1155(
        IERC1155 nftContract_,
        uint256 nftId_,
        uint256 nftAmount_
    ) onlyOwner

Withdraw the ERC1155 token with address `nftContract_`, ID `nftId_` and amount `nftAmount_`, transferring it to the contract owner.\
In case the token is for sale at that moment, only the amount of token that is not on redeem can be withdrawn.\
For example, if the contract owns 10 tokens and 6 tokens are on redeem, at maximum 4 tokens can be withdrawn by the owner.

The function can be only called by the owner.

___

    function buyERC721(
        IERC721 nftContract_,
        uint256 nftId_
    )

Buy the ERC721 token with address `nftContract_` and ID `nftId_`, transferring it to the caller.\
The caller has to pay the ERC20 token amount, set when creating the sale, in exchange of the ERC721 token.

The ERC20 token will be transferred to the payment ERC20 address set by `setPaymentERC20Address`.

___

    function buyERC1155(
        IERC1155 nftContract_,
        uint256 nftId_,
        uint256 nftAmount_
    )

Buy the ERC1155 token with address `nftContract_`, ID `nftId_` and amount `nftAmount_`, transferring it to the caller.\
The caller has to pay the ERC20 token amount, set when creating the sale, in exchange of the ERC1155 token.

The ERC20 token will be transferred to the payment ERC20 address set by `setPaymentERC20Address`.

___

    function isSaleActive(
        address nftContract_,
        uint256 nftId_
    )

Get if the token sale with address `nftContract_` and ID `nftId_` is active.

### "NftsRedeemer" functions

    function createERC721Redeem(
        address redeemer_,
        IERC721 nftContract_,
        uint256 nftId_,
        IERC20 erc20Contract_,
        uint256 erc20Amount_
    ) onlyOwner

Reserve the ERC721 token with address `nftContract_`, ID `nftId_` and amount `nftAmount_` for the user `redeemer_`.
The token shall be owned by the contract.\
The price of the token is `erc20Amount_` of the ERC20 token with address `erc20Contract_`.

The function can be only called by the owner.

___

    function createERC1155Redeem(
        address redeemer_,
        IERC1155 nftContract_,
        uint256 nftId_,
        uint256 nftAmount_,
        IERC20 erc20Contract_,
        uint256 erc20Amount_
    ) onlyOwner

Reserve the ERC1155 token with address `nftContract_` and ID `nftId_` for the user `redeemer_`. The token shall be owned by the contract.\
The price of the token is `erc20Amount_` of the ERC20 token with address `erc20Contract_`.

The function can be only called by the owner.

___

    function removeRedeem(
        address redeemer_
    ) onlyOwner

Remove the token reservation for the user `redeemer_`.

The function can be only called by the owner.

___

    function withdrawERC721(
        IERC721 nftContract_,
        uint256 nftId_
    ) onlyOwner

Withdraw the ERC721 token with address `nftContract_` and ID `nftId_`, transferring it to the contract owner.\
The token shall not be reserved. In case it is, it shall be removed before calling the function.

The function can be only called by the owner.

___

    function withdrawERC1155(
        IERC1155 nftContract_,
        uint256 nftId_,
        uint256 nftAmount_
    ) onlyOwner

Withdraw the ERC1155 token with address `nftContract_`, ID `nftId_` and amount `nftAmount_`, transferring it to the contract owner.\
In case the token is reserved, only the amount of token that is not reserved can be withdrawn.\
For example, if the contract owns 10 tokens and 6 tokens are reserved, at maximum 4 tokens can be withdrawn by the owner.

The function can be only called by the owner.

___

    function redeemToken()

Redeem the token reserved for the caller, transferring it to it.\
The caller has to pay the ERC20 token amount, set when creating the redeem, in exchange of the token.

The ERC20 token will be transferred to the payment ERC20 address set by `setPaymentERC20Address`.

___

    function isRedeemActive(
        address redeemer_
    )

Get if the user address `redeemer_` has an active redeem.

___

    function isRedeemActive(
        address nftContract_,
        uint256 nftId_
    )

Get if the redeem for the token with address `nftContract_` and ID `nftId_` is active.

### "NftsAuction" functions

    function createERC721Auction(
        IERC721 nftContract_,
        uint256 nftId_,
        IERC20 erc20Contract_,
        uint256 erc20StartPrice_,
        uint256 erc20MinimumBidIncrement_,
        uint256 durationSec_,
        uint256 extendTimeSec_
    ) onlyOwner

Create an auction for a ERC721 token with address `nftContract_` and ID `nftId_`. The token shall be owned by the contract.\
The starting price of the auction is `erc20StartPrice_` amount of the ERC20 token with address `erc20Contract_`
and the minimum bid increment is `erc20MinimumBidIncrement_` of the same token.\
The auction will last `erc20MinimumBidIncrement_` seconds.

If a user bids when the auction is expiring in `extendTimeSec_` seconds, the auction will be extended of `extendTimeSec_` seconds.
To disable this behavior, set it to zero.

The function can be only called by the owner.

___

    function createERC1155Auction(
        IERC1155 nftContract_,
        uint256 nftId_,
        uint256 nftAmount_,
        IERC20 erc20Contract_,
        uint256 erc20StartPrice_,
        uint256 erc20MinimumBidIncrement_,
        uint256 durationSec_,
        uint256 extendTimeSec_
    ) onlyOwner

Create an auction for a ERC1155 token with address `nftContract_`, ID `nftId_` and amount `nftAmount_`. The token shall be owned by the contract.\
The starting price of the auction is `erc20StartPrice_` amount of the ERC20 token with address `erc20Contract_`
and the minimum bid increment is `erc20MinimumBidIncrement_` of the same token.\
The auction will last `erc20MinimumBidIncrement_` seconds.

If a user bids when the auction is expiring in `extendTimeSec_` seconds, the auction will be extended of `extendTimeSec_` seconds.
To disable this behavior, set it to zero.

The function can be only called by the owner.

___

    function removeAuction(
        address nftContract_,
        uint256 nftId_
    ) onlyOwner

Remove the auction of the token (ERC721 or ERC1155) with address `nftContract_` and ID `nftId_`.

The function can be only called by the owner.

___

    function withdrawERC721(
        IERC721 nftContract_,
        uint256 nftId_
    ) onlyOwner

Withdraw the ERC721 token with address `nftContract_` and ID `nftId_`, transferring it to the contract owner.\
The token shall not be on auction at that moment. In case it is, it shall be removed before calling the function.

The function can be only called by the owner.

___

    function withdrawERC1155(
        IERC1155 nftContract_,
        uint256 nftId_,
        uint256 nftAmount_
    ) onlyOwner

Withdraw the ERC1155 token with address `nftContract_`, ID `nftId_` and amount `nftAmount_`, transferring it to the contract owner.\
In case the token is on auction at that moment, only the amount of token that is not on auction can be withdrawn.\
For example, if the contract owns 10 tokens and 6 tokens are on auction, at maximum 4 tokens can be withdrawn by the owner.

The function can be only called by the owner.

___

    function bidAtAuction(
        address nftContract_,
        uint256 nftId_,
        uint256 erc20BidAmount_
    )

Bid at the auction of the token (ERC721 or ERC1155) with address `nftContract_` and ID `nftId_`.
The bid amount is `erc20BidAmount_` of the ERC20 token set for the auction.

The bid is valid if:

- `erc20BidAmount_` is higher than the current highest bid plus the minimum bid amount set for the auction
- The auction is not expired

___

    function completeAuction(
        address nftContract_,
        uint256 nftId_
    )

Complete the auction of the token (ERC721 or ERC1155) with address `nftContract_` and ID `nftId_`.\
The function is called by the winner of the auction to get the token and pay for it.\
The caller has to pay the ERC20 token amount, that he bid, in exchange of the token.

The function can be only called by the winner of the auction.

The ERC20 token will be transferred to the payment ERC20 address set by `setPaymentERC20Address`.

___

    function isAuctionActive(
        address nftContract_,
        uint256 nftId_
    )

Get if the auction for the token with address `nftContract_` and ID `nftId_` is active.

___

    function isAuctionExpired(
        address nftContract_,
        uint256 nftId_
    )

Get if the auction for the token with address `nftContract_` and ID `nftId_` is expired.

___

    function isAuctionCompleted(
        address nftContract_,
        uint256 nftId_
    )

Get if the auction for the token with address `nftContract_` and ID `nftId_` is completed.

# License

This software is available under the MIT license.
