// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

//=============================================================//
//                           IMPORTS                           //
//=============================================================//
import {NftsAuction} from "../NftsAuction.sol";


/**
 * @author Emanuele Bellocchia (ebellocchia@gmail.com)
 * @title  To test the contract upgradeability
 */
contract NftsAuctionUpgraded is
    NftsAuction
{
    //=============================================================//
    //                       PUBLIC FUNCTIONS                      //
    //=============================================================//

    /**
     * New function to check if the contract has been upgraded
     */
    function isUpgraded() public pure returns (bool) {
        return true;
    }
}
