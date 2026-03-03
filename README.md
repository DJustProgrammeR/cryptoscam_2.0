Пивной напиток безалкогольный, состав: Меркушев Владислав, Бородавко Сергей, Вербицкий Александр

ChainID: 11155111 (Seploia)

Рецепт своей монеты по шагам:  
    0. Metamask, создали кошельки, нагнали монет в Sepolia https://cloud.google.com/application/web3/faucet/ethereum/sepolia
    1. Подтянули abstract contract ERC20, немного изучили solidity  
    2. Реализовали запрошенный функционал  
    3. В тестовой VM Remix IDE погонял транзакции перед релизом в Sepolia  
    4. Создал EtherScan акк, скопировал API ключ, подключился к сети Sepolia, раскатил и верифицировал контракт в etherscan
    5. Погоняли транзакции https://sepolia.etherscan.io/token/0x50954724f65e329bd50f0cff07b576d9acd1cb2e
    6. Успех!

Контракт(EtherScan): https://sepolia.etherscan.io/token/0x50954724f65e329bd50f0cff07b576d9acd1cb2e#code

----

REMIX DEFAULT WORKSPACE

Remix default workspace is present when:
i. Remix loads for the very first time 
ii. A new workspace is created with 'Default' template
iii. There are no files existing in the File Explorer

This workspace contains 3 directories:

1. 'contracts': Holds three contracts with increasing levels of complexity.
2. 'scripts': Contains four typescript files to deploy a contract. It is explained below.
3. 'tests': Contains one Solidity test file for 'Ballot' contract & one JS test file for 'Storage' contract.

SCRIPTS

The 'scripts' folder has two typescript files which help to deploy the 'Storage' contract using 'ethers.js' libraries.

For the deployment of any other contract, just update the contract name from 'Storage' to the desired contract and provide constructor arguments accordingly 
in the file `deploy_with_ethers.ts`

In the 'tests' folder there is a script containing Mocha-Chai unit tests for 'Storage' contract.

To run a script, right click on file name in the file explorer and click 'Run'. Remember, Solidity file must already be compiled.
Output from script will appear in remix terminal.

Please note, require/import is supported in a limited manner for Remix supported modules.
For now, modules supported by Remix are ethers, swarmgw, chai, multihashes, remix and hardhat only for hardhat.ethers object/plugin.
For unsupported modules, an error like this will be thrown: '<module_name> module require is not supported by Remix IDE' will be shown.
