const { ERC20Mock, WOMTokenLocker, expectRevert, ZERO_ADDRESS, time } = require('./common')

contract('WOMTokenLocker', ([owner, owner_1, user, user_2, attacker]) => {
	beforeEach(async () => {
        this.one_ether = await web3.utils.toWei('0.5', 'ether')
        this.one_ether = await web3.utils.toWei('1', 'ether')
        this.token = await ERC20Mock.new("WOM Token", "WOM", this.one_ether, { from: owner })
        this.lock = await WOMTokenLocker.new(this.token.address, { from: owner })
        this.epoch = await time.latest()
        this.days = await time.duration.days(5)
        this.unlock = +this.epoch + +this.days
    })
    describe('owner functionality', () => {
        it('owner is set', async () => {
            assert.equal(await this.lock.owner(), owner)
        });
        it('wom token set', async () => {
            assert.equal(await this.lock.WOM_TOKEN(), this.token.address)
        });
        describe('transfer ownership', () => {
            describe('non-functional', () => {
                it('revert when call from attacker', async () => {
                    await expectRevert(this.lock.transferOwnership(owner_1, { from: attacker}), 'Ownable: caller is not the owner')
                });
            });
            describe('functional', () => {
                beforeEach(async () => {
                    await this.lock.transferOwnership(owner_1, { from: owner })
                });
                it('owner updated', async () => {
                    assert.equal(await this.lock.owner(), owner_1)
                });
            });
        });
        describe('renounce ownership', () => {
            describe('non-functional', () => {
                it('revert when call from attacker', async () => {
                    await expectRevert(this.lock.renounceOwnership({ from: attacker}), 'Ownable: caller is not the owner')
                });
            });
            describe('functional', () => {
                beforeEach(async () => {
                    await this.lock.renounceOwnership({ from: owner })
                });
                it('owner updated', async () => {
                    assert.equal(await this.lock.owner(), ZERO_ADDRESS)
                });
            });
        });
    });
    describe('add allocation', () => {
        describe('non-functional', () => {
            it('revert when attacker', async () => {
                await expectRevert(this.lock.addAllocation(user, this.unlock, this.one_ether, { from: attacker }), 'Ownable: caller is not the owner')
            });
            it('revert when contract not approved', async () => {
                await expectRevert(this.lock.addAllocation(user, this.unlock, this.one_ether, { from: owner }), 'WOMTokenLocker: allowance is less than amount')
            });
        });
        describe('when approved', () => {
            beforeEach(async () => {
                await this.token.approve(this.lock.address, this.one_ether, { from: owner })
            });
            it('allowance updated', async () => {
                assert.equal(await this.token.allowance(owner, this.lock.address), this.one_ether)
            });
            describe('functional', () => {
                beforeEach(async () => {
                    await this.lock.addAllocation(user, this.unlock, this.one_ether, { from: owner })
                });
                it('contract balance updated', async () => {
                    assert.equal(await this.token.balanceOf(this.lock.address), this.one_ether)
                });
                it('allowance updated', async () => {
                    assert.equal(await this.token.allowance(owner, this.lock.address), 0)
                });
            });
        });
    });
    describe('remove allocation', () => {
        describe('non-functional', () => {
            it('revert when attacker', async () => {
                await expectRevert(this.lock.removeAllocation(user, { from: attacker }), 'Ownable: caller is not the owner')
            });
            it('revert when allocation does not exist', async () => {
                await expectRevert(this.lock.removeAllocation(user, { from: owner }), 'WOMTokenLocker: client does not exist')
            });
        });
        describe('when approval set', () => {
            beforeEach(async () => {
                await this.token.approve(this.lock.address, this.one_ether, { from: owner})
            });
            describe('when allocation set', () => {
                beforeEach(async () => {
                    await this.lock.addAllocation(user, this.unlock, this.one_ether, { from: owner })
                });
                describe('functional', () => {
                    beforeEach(async () => {
                        await this.lock.removeAllocation(user, { from: owner })
                    });
                    it('contract balance updated', async () => {
                        assert.equal(await this.token.balanceOf(this.lock.address), 0)
                    });
                    it('owner balance updated', async () => {
                        assert.equal(await this.token.balanceOf(owner), this.one_ether)
                    });
                });
            });
        });
    });
    describe('claim allocation', () => {
        describe('non-functional', () => {
            it('revert when no allocation', async () => {
                await expectRevert(this.lock.claimAllocation({ from: attacker }), 'WOMTokenLocker: client does not have allocation')
            });
        });
        describe('when approval set', () => {
            beforeEach(async () => {
                await this.token.approve(this.lock.address, this.one_ether, { from: owner})
            });
            describe('when allocation set', () => {
                beforeEach(async () => {
                    await this.lock.addAllocation(user, this.unlock, this.one_ether, { from: owner })
                });
                it('revert when less than release time', async () => {
                    await expectRevert(this.lock.claimAllocation({ from: user }), 'WOMTokenLocker: client cannot claim with time lock')
                });
                describe('when time manipulated', () => {
                    beforeEach(async () => {
                        await time.increaseTo(this.unlock)
                    });
                    describe('when contract drained', () => {
                        beforeEach(async () => {
                            await this.token.burn(this.lock.address, this.one_ether)
                        });
                        it('contract balance updated', async () => {
                            assert.equal(await this.token.balanceOf(this.lock.address), 0)
                        });
                        it('revert when contract empty balance', async () => {
                            await expectRevert(this.lock.claimAllocation({ from : user }), 'WOMTokenLocker: contract does not have sufficient funds')
                        });
                    });
                    describe('functional', () => {
                        beforeEach(async () => {
                            await this.lock.claimAllocation({ from: user })
                        });
                        it('contract balance updated', async () => {
                            assert.equal(await this.token.balanceOf(this.lock.address), 0)
                        });
                        it('owner balance updated', async () => {
                            assert.equal(await this.token.balanceOf(user), this.one_ether)
                        });
                    });
                });
            });
        });
    });
})