import 'dotenv/config';
import {HardhatUserConfig, task} from 'hardhat/config';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-gas-reporter';
import '@typechain/hardhat';
import 'solidity-coverage';
import 'hardhat-deploy-tenderly';
import {node_url, accounts, addForkConfiguration, etherscan} from './utils/network';

import {deploy} from './utils/sales/deploy';
import {BigNumber} from 'ethers';

task('deploy-sale', 'Deploy a sale for Blueberry Club items')
  .addParam('implementation', `The type of sale to deploy "holder", "merkle" or "classic" (ex: "classic")`)
  .addParam('price', `The price to mint 1 item in ETH (ex: "0.01")`)
  .addParam('supply', `The maximum amount mintable (ex: "1000")`)
  .addParam('wallet', `The maximum amount mintable for 1 user (ex: "100")`)
  .addParam('transaction', `The maximum amount mintable in same call (ex: "10")`)
  .addParam('start', `The timestamp (in seconds) when the sale start (ex: "0")`)
  .addParam('end', `The timestamp (in seconds) when the sale end (ex: "9999999999999999999999")`)
  .addParam('tokenId', `The item to mint (ex: "1000")`)
  .addParam(
    'currency',
    `The ERC20 token you want use for sale and 0 for ETH (ex: "0x0000000000000000000000000000000000000000")`
  )
  .addOptionalParam(
    'collection',
    `Only if implementation is "holder" the address of NFTs you want user to hold (ex: "0x17f4baa9d35ee54ffbcb2608e20786473c7aa49f")`
  )
  .addOptionalParam(
    'root',
    `The merkle root for the sale (ex: "0x0000000000000000000000000000000000000000000000000000000000000000")`
  )
  .setAction(
    async (
      taskArgs: {
        implementation: string;
        price: string;
        supply: string;
        wallet: string;
        transaction: string;
        start: string;
        end: string;
        tokenId: string;
        currency: string;
        collection?: string;
        root?: string;
      },
      hre
    ) => {
      if (
        taskArgs.implementation != 'classic' &&
        taskArgs.implementation != 'merkle' &&
        taskArgs.implementation != 'holder'
      ) {
        throw new Error('Unknown implementation');
      }

      if (taskArgs.implementation == 'classic') {
        console.log(`Deploying...`);
        const clone = await deploy(hre).classic(
          BigNumber.from(taskArgs.price),
          BigNumber.from(taskArgs.supply),
          BigNumber.from(taskArgs.wallet),
          BigNumber.from(taskArgs.transaction),
          BigNumber.from(taskArgs.start),
          BigNumber.from(taskArgs.end),
          BigNumber.from(taskArgs.tokenId),
          taskArgs.currency
        );

        if (clone) {
          console.log(`Deployed !`);
          console.log(`ClassicSale: ${clone.address}`);
        } else {
          console.log(`Failed !`);
        }
      }

      if (taskArgs.implementation == 'merkle') {
        if (!taskArgs.root) {
          throw new Error('Missing root for MerkleSale');
        }

        console.log(`Deploying...`);
        const clone = await deploy(hre).merkle(
          BigNumber.from(taskArgs.price),
          BigNumber.from(taskArgs.supply),
          BigNumber.from(taskArgs.wallet),
          BigNumber.from(taskArgs.transaction),
          BigNumber.from(taskArgs.start),
          BigNumber.from(taskArgs.end),
          BigNumber.from(taskArgs.tokenId),
          taskArgs.currency,
          taskArgs.root
        );

        if (clone) {
          console.log(`Deployed !`);
          console.log(`MerkleSale: ${clone.address}`);
        } else {
          console.log(`Failed !`);
        }
      }

      if (taskArgs.implementation == 'holder') {
        if (!taskArgs.collection) {
          throw new Error('Missing collection for HolderSale');
        }

        console.log(`Deploying...`);
        const clone = await deploy(hre).holder(
          BigNumber.from(taskArgs.price),
          BigNumber.from(taskArgs.supply),
          BigNumber.from(taskArgs.wallet),
          BigNumber.from(taskArgs.transaction),
          BigNumber.from(taskArgs.start),
          BigNumber.from(taskArgs.end),
          BigNumber.from(taskArgs.tokenId),
          taskArgs.currency,
          taskArgs.collection
        );

        if (clone) {
          console.log(`Deployed !`);
          console.log(`HolderSale: ${clone.address}`);
        } else {
          console.log(`Failed !`);
        }
      }
    }
  );

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.9',
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: 0,
    alice: 1,
    bob: 2,
    mark: 3,
  },
  networks: addForkConfiguration({
    hardhat: {
      initialBaseFeePerGas: 0,
    },
    localhost: {
      url: node_url('localhost'),
      accounts: accounts(),
    },
    arbitrum_rinkeby: {
      url: node_url('arbitrum_rinkeby'),
      accounts: accounts('arbitrum_rinkeby'),
      verify: etherscan('arbitrum_rinkeby'),
    },
    arbitrum: {
      url: node_url('arbitrum'),
      accounts: accounts('arbitrum'),
      verify: etherscan('arbitrum'),
    },
  }),
  paths: {
    sources: 'src',
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: 'EUR',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    gasPrice: 100,
    token: 'ETH',
    gasPriceApi: 'https://api.arbiscan.io/api?module=proxy&action=eth_gasPrice',
    onlyCalledMethods: false,
    showTimeSpent: true,
    src: 'src',
    showMethodSig: true,
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
  mocha: {
    timeout: 0,
  },
  external: process.env.HARDHAT_FORK
    ? {
        deployments: {
          hardhat: ['deployments/' + process.env.HARDHAT_FORK],
          localhost: ['deployments/' + process.env.HARDHAT_FORK],
        },
      }
    : undefined,
};

export default config;
