const { constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers')
const { ZERO_ADDRESS } = constants

const ERC20Mock = artifacts.require("ERC20Mock")
const WOMTokenLocker = artifacts.require("WOMTokenLocker")

module.exports = {
    expectEvent,
    expectRevert,
    time,
    ZERO_ADDRESS,
    ERC20Mock,
    WOMTokenLocker
}