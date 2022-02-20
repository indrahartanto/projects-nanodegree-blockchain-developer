/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message`
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {
  /**
   * Constructor of the class, you will need to setup your chain array and the height
   * of your chain (the length of your chain array).
   * Also everytime you create a Blockchain class you will need to initialized the chain creating
   * the Genesis Block.
   * The methods in this class will always return a Promise to allow client applications or
   * other backends to call asynchronous functions.
   */
  constructor() {
    this.chain = [];
    this.height = -1;
    this.initializeChain();
  }

  /**
   * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
   * You should use the `addBlock(block)` to create the Genesis Block
   * Passing as a data `{data: 'Genesis Block'}`
   */
  async initializeChain() {
    if (this.height === -1) {
      let block = new BlockClass.Block({ data: 'Genesis Block' });
      await this._addBlock(block).catch((error) => console.log(error));
      //   await this._addBlock(new BlockClass.Block({ data: 'Genesis Block22' }));
    }
  }

  /**
   * Utility method that return a Promise that will resolve with the height of the chain
   */
  getChainHeight() {
    return new Promise((resolve, reject) => {
      resolve(this.height);
    });
  }

  /**
   * _addBlock(block) will store a block in the chain
   * @param {*} block
   * The method will return a Promise that will resolve with the block added
   * or reject if an error happen during the execution.
   * You will need to check for the height to assign the `previousBlockHash`,
   * assign the `timestamp` and the correct `height`...At the end you need to
   * create the `block hash` and push the block into the chain array. Don't for get
   * to update the `this.height`
   * Note: the symbol `_` in the method name indicates in the javascript convention
   * that this method is a private method.
   */
  async _addBlock(block) {
    try {
      let self = this;

      block.height = self.chain.length;
      self.height = self.chain.length;
      block.time = new Date().getTime().toString().slice(0, -3);
      if (self.chain.length > 0) {
        block.previousBlockHash = self.chain[self.chain.length - 1].hash;
      }
      //   console.log(`height: ${block.height}`);
      //   console.log(JSON.stringify(block));
      block.hash = SHA256(JSON.stringify(block)).toString();

      //   console.log(block);
      self.chain.push(block);
      //   console.log(self);
      return block;
    } catch (error) {
      throw new Error('Error adding block!');
    }
    // return new Promise(async (resolve, reject) => {
    // });
  }

  /**
   * The requestMessageOwnershipVerification(address) method
   * will allow you  to request a message that you will use to
   * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
   * This is the first step before submit your Block.
   * The method return a Promise that will resolve with the message to be signed
   * @param {*} address
   */
  async requestMessageOwnershipVerification(address) {
    return address.concat(
      ':',
      new Date().getTime().toString().slice(0, -3),
      ':starRegistry'
    );
    // return new Promise((resolve) => {});
  }

  /**
   * The submitStar(address, message, signature, star) method
   * will allow users to register a new Block with the star object
   * into the chain. This method will resolve with the Block added or
   * reject with an error.
   * Algorithm steps:
   * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
   * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
   * 3. Check if the time elapsed is less than 5 minutes
   * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
   * 5. Create the block and add it to the chain
   * 6. Resolve with the block added.
   * @param {*} address
   * @param {*} message
   * @param {*} signature
   * @param {*} star
   */
  async submitStar(address, message, signature, star) {
    try {
      let self = this;
      if (bitcoinMessage.verify(message, address, signature)) {
        const result = await this._addBlock(
          new BlockClass.Block({ owner: address, star: star })
        );
        // console.log(result);
        return result;
      } else {
        throw new Error('Error in verifying submitted message!');
      }
    } catch (error) {
      throw new Error('Error registering new Block!');
    }
    // return new Promise(async (resolve, reject) => {});
  }

  /**
   * This method will return a Promise that will resolve with the Block
   *  with the hash passed as a parameter.
   * Search on the chain array for the block that has the hash.
   * @param {*} hash
   */
  async getBlockByHash(hash) {
    try {
      let self = this;
      const result = self.chain.filter((block) => block.hash === hash)[0];
      //   console.log(result);
      return result;
    } catch (error) {
      throw new Error('Error in getting block by hash!');
    }
    // return new Promise((resolve, reject) => {});
  }

  /**
   * This method will return a Promise that will resolve with the Block object
   * with the height equal to the parameter `height`
   * @param {*} height
   */
  getBlockByHeight(height) {
    let self = this;
    return new Promise((resolve, reject) => {
      let block = self.chain.filter((p) => p.height === height)[0];
      //   console.log(block);
      if (block) {
        resolve(block);
      } else {
        resolve(null);
      }
    });
  }

  /**
   * This method will return a Promise that will resolve with an array of Stars objects existing in the chain
   * and are belongs to the owner with the wallet address passed as parameter.
   * Remember the star should be returned decoded.
   * @param {*} address
   */
  async getStarsByWalletAddress(address) {
    try {
      let self = this;
      let stars = [];
      let ownerStarsData = [];

      const asyncRes = await Promise.all(
        self.chain.map(async (block) => {
          const result = await block.getBData();
          if (result) ownerStarsData.push(result);
        })
      );

      stars = ownerStarsData.filter((data) => data.owner === address);
      return stars;
    } catch (error) {
      throw new Error('Error in getting block by wallet address');
    }
    // return new Promise((resolve, reject) => {});
  }

  /**
   * This method will return a Promise that will resolve with the list of errors when validating the chain.
   * Steps to validate:
   * 1. You should validate each block using `validateBlock`
   * 2. Each Block should check the with the previousBlockHash
   */
  async validateChain() {
    try {
      let self = this;
      let errorLog = [];
      //   console.log(`chain 0: ${JSON.stringify(self.chain[0])}`);

      //   const result = await self.chain[1].validate();

      //   console.log(`validation result: ${result}`);
      //   const tempBlock = new BlockClass.Block('');
      //   tempBlock = self.chain[0];
      //   console.log(tempBlock);

      //   console.log(self.chain);
      const asyncRes = await Promise.all(
        self.chain.map(async (block) => {
          const result = await block.validate();
          errorLog.push(result);
        })
      );
      return errorLog;
    } catch (error) {
      throw new Error('Error validating chain!');
    }
    // return new Promise(async (resolve, reject) => {});
  }
}

module.exports.Blockchain = Blockchain;

// const test = async () => {
//   try {
//     const blockchain = new Blockchain();

//     // console.log(
//     //   blockchain.requestMessageOwnershipVerification(
//     //     '1LPpX52fiwusu2VWzy6UDm9qxbQbPt9wMY'
//     //   )
//     // );

//     const star = {
//       dec: "68° 52' 56.9",
//       ra: '16h 29m 1.0s',
//       story: 'Testing the story 4',
//     };
//     const star2 = {
//       dec: "1° 1' 1",
//       ra: '1h 1m 1.0s',
//       story: '1Testing the story 1',
//     };
//     const address = '1LPpX52fiwusu2VWzy6UDm9qxbQbPt9wMY';
//     const message =
//       '1LPpX52fiwusu2VWzy6UDm9qxbQbPt9wMY:1645341645:starRegistry';
//     const signature =
//       'HxagA1/e7vtl9ZJtXLGpdsL3S0H4pW+2QQ++0kcwzJqLVczILwKU+VaMDFJ87tVr6/3waRHct5nLBVPnzEyh5+U=';

//     const address2 = '1ED5FnwxN4XuXPH8NM8Ge2MbeczGeDhT1c';
//     const message2 =
//       '1ED5FnwxN4XuXPH8NM8Ge2MbeczGeDhT1c:1645341645:starRegistry';
//     const signature2 =
//       'IAX0BGxxPiw/6EsRv9Nd2gZABhOeRU0QrgZGveh6vhItXo/sJXDfLWuV03EYk+v+8cZ+esnuOJa8YnMDO/q2X28=';

//     const result = JSON.stringify(
//       await blockchain.submitStar(address, message, signature, star)
//     );

//     const result2 = JSON.stringify(
//       await blockchain.submitStar(address2, message2, signature2, star)
//     );

//     const result3 = JSON.stringify(
//       await blockchain.submitStar(address, message, signature, star2)
//     );

//     const searchResult = await blockchain.getBlockByHash(
//       JSON.parse(result2).hash
//     );
//     // console.log(searchResult);

//     const validateResult = await blockchain.validateChain();
//     // console.log(validateResult);

//     // console.log(blockchain.getBlockByHeight(2));

//     blockchain.getStarsByWalletAddress(address2);

//     // console.log(blockchain);
//   } catch (error) {
//     console.log(error.message);
//   }
// };

// test();
