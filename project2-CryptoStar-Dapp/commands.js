let instance = await StarNotary.deployed();
let accounts = await web3.eth.getAccounts();

// create star
await instance.createStar('StarA', 1, { from: accounts[0] });
await instance.createStar('StarB', 2, { from: accounts[1] });

// lookUptokenIdToStarInfo
let name = await instance.lookUptokenIdToStarInfo(1);

// putStartUpForSale
await instance.putStarUpForSale(1, web3.utils.toWei('.01', 'ether'), {
  from: accounts[0],
});

// exchangeStars
await instance.exchangeStars(1, 2, { from: accounts[3] });

// transferStar
await instance.transferStar(accounts[1], 1, { from: accounts[0] });
