//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import {ClonesWithImmutableArgs} from "clones-with-immutable-args/ClonesWithImmutableArgs.sol";
import {Auth, Authority} from "@rari-capital/solmate/src/auth/Auth.sol";

contract SaleFactory is Auth(msg.sender, Authority(address(0))) {
    using ClonesWithImmutableArgs for address;

    event NewSale(address indexed implementation, address indexed clone);

    function deploy(address implementation, bytes memory data) external returns (address clone) {
        clone = implementation.clone(data);

        emit NewSale(implementation, clone);
    }
}