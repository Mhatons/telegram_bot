// const TronWeb = require('tronweb');
const {TronWeb} = require('tronweb');
const masterPrivateKey = '676fa128bc3347ef7acd09db48198d94ae9386992de911461d5d10ac2bf9bf7b'; 


// Generating new addresses for each users
const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    privateKey: masterPrivateKey
});

// Function to create new user deposit address
const createAddress = async () => {
    try {
        const newAccount = await tronWeb.createAccount();  // Await since it returns a promise
        return newAccount;
    } catch (error) {
        console.error("Error creating new account:", error);
    }
}

// const createAddress = () => {
//     const newAccount = tronWeb.createAccount();
//     return newAccount
// }

const address = createAddress();
console.log("user's deposit address:", address)


// Tracking generated addresses for successful deposit
// async function checkBalance(address) {
//     const balance = await tronWeb.trx.getBalance(address);
//     console.log(`TRX Balance of ${address}: ${balance}`)
// }

// Checking balance
// const usdtContractAddress = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';  // USDT TRC20 contract address

// async function getUSDTBalance(address) {
//     const contract = await tronWeb.contract().at(usdtContractAddress);
//     const balance = await contract.methods.balanceOf(address).call();
//     console.log(`USDT Balance of ${address}: ${balance}`);
// }

// getUSDTBalance('USER_DEPOSIT_ADDRESS');


// moving deposited funds from generated address to master account
// async function sweepFunds(userAddress, masterAddress, amount) {
//     const transaction = await tronWeb.trx.sendToken(userAddress, amount, usdtContractAddress, masterAddress);
//     console.log('Funds swept to master account:', transaction);
// }


// async function sweepFunds(userAddressPrivateKey, userAddress, masterAddress, amount) {
//     const tronWebUser = new TronWeb({
//         fullHost: 'https://api.trongrid.io',
//         privateKey: userAddressPrivateKey  // Using user's address private key to sign the transaction
//     });

//     const usdtContractAddress = "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj";  // TRC20 USDT contract address

//     try {
//         // Trigger a token transfer from user's address to master account
//         const transaction = await tronWebUser.trx.sendToken(masterAddress, amount, usdtContractAddress);
//         console.log('Funds swept to master account:', transaction);
//     } catch (error) {
//         console.error('Error sweeping funds:', error);
//     }
// }

// automate transfer process
// async function monitorDeposits(userAddress, userAddressPrivateKey, masterAddress) {
//     const balance = await tronWeb.trx.getBalance(userAddress, usdtContractAddress); // Get the balance of the user address in USDT
    
//     if (balance > 0) {
//         // Sweep the balance to the master account
//         await sweepFunds(userAddressPrivateKey, userAddress, masterAddress, balance);
//         console.log(`Swept ${balance} USDT from ${userAddress} to ${masterAddress}`);
//     } else {
//         console.log(`No funds to sweep from ${userAddress}`);
//     }
// }
















// *********************************************************************************************************************************

// Function to generate new deposit address and private key
async function generateUserWallet() {
    const newAccount = await tronWeb.createAccount();
    
    // This will give you the user's address and private key
    console.log('New Address:', newAccount.address.base58);
    console.log('Private Key:', newAccount.privateKey);
    
    return {
        address: newAccount.address.base58,
        privateKey: newAccount.privateKey
    };
}

// sweeping funds
async function sweepFunds(userPrivateKey, userAddress, masterAddress, amount) {
    const tronWebUser = new TronWeb({
        fullHost: 'https://api.trongrid.io',
        privateKey: userPrivateKey  // User's private key to sign the transaction
    });

    const usdtContractAddress = "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj";  // TRC20 USDT contract address

    try {
        // Trigger a token transfer from user's address to the master account
        const transaction = await tronWebUser.trx.sendToken(masterAddress, amount, usdtContractAddress);
        console.log('Funds swept to master account:', transaction);
    } catch (error) {
        console.error('Error sweeping funds:', error);
    }
}

// Example of sweeping funds from user's account to master account
const userPrivateKey = "USER_GENERATED_PRIVATE_KEY";  // Replace with actual user's private key
const userAddress = "USER_GENERATED_ADDRESS";         // Replace with actual user's address
const masterAddress = "MASTER_ACCOUNT_ADDRESS";       // Your master account address
const amountToSweep = 1000000;  // Example: sweeping 1 USDT (1 USDT = 1,000,000 in smallest unit)

// sweepFunds(userPrivateKey, userAddress, masterAddress, amountToSweep);
