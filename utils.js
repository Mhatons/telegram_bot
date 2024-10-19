module.exports = function formatDateTime(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const year = date.getFullYear();
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
}






// // Initialize TronWeb
// const tronWeb = new TronWeb({
//     fullHost: 'https://api.shasta.trongrid.io', // Change if using Mainnet
// });

// // In-memory object to store user data
// const userWallets = {};

// // Constants
// const usdtContractAddress = 'TQQg4EL8o1BSeKJY4MJ8TB8XK7xufxFBvK'; // USDT TRC20
// // const usdtContractAddress = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'; // USDT TRC20
// const masterAccountAddress = 'TKxPnNRCa6Tmcysb8j1ftXnm2EdXdq8mx6'; // Master account
// const pollingInterval = 10000; // Poll every 10 seconds (adjust as needed)

// // Function to create a new user deposit address
// const createAddress = async () => {
//     try {
//         const newAccount = await tronWeb.createAccount();
//         console.log("New account created:", newAccount.address.base58);
//         return {
//             address: newAccount.address.base58,
//             privateKey: newAccount.privateKey,
//         };
//     } catch (error) {
//         console.error('Error creating account:', error);
//         return null;
//     }
// };

// // Function to generate deposit address for a user
// const getUserDepositAddress = async (chatId) => {
//     console.log(`Generating deposit address for chat ID: ${chatId}`);
//     const { address, privateKey } = await createAddress();
//     if (address) {
//         console.log("User's deposit address:", address);
//         console.log("User's private key:", privateKey);
//         userWallets[chatId] = { address, privateKey };
//     } else {
//         console.log('Error generating deposit address.');
//     }
// };

// // Function to check TRX balance for gas fees
// const checkTrxBalance = async (chatId, requiredTrxForGas) => {
//     const userAddress = userWallets[chatId]?.address;
//     if (!userAddress) {
//         console.log('User address not found');
//         return false;
//     }
//     const balance = await tronWeb.trx.getBalance(userAddress);
//     console.log(`TRX balance for ${userAddress}: ${balance}`);
//     return balance >= requiredTrxForGas;
// };

// // Function to monitor USDT deposits continuously
// const monitorUsdtDeposit = async (chatId, expectedDepositAmount) => {
//     const userAddress = userWallets[chatId]?.address;
//     if (!userAddress) {
//         console.log('User address not found');
//         return;
//     }

//     console.log("console at the bridge", "())()()()()()()()(())()))")

//     // const usdtContract = await tronWeb.contract().at(usdtContractAddress);
//     let usdtContract;
//     try {
//         usdtContract = await tronWeb.contract().at(usdtContractAddress);
//         console.log("USDT contract initialized.");
//     } catch (error) {
//         console.error("Error initializing USDT contract:", error);
//         return; // Exit if the contract initialization fails
//     }

//     const checkDeposit = async () => {
//         try {
//             // Ensure that userAddress is correctly defined and passed.
//             const usdtBalance = await usdtContract.balanceOf(userAddress).call({
//                 from: userAddress,  // Add this parameter
//             });
//             console.log(`USDT balance for ${userAddress}: ${usdtBalance}`);

//             const trxBalance = await tronWeb.trx.getBalance(userAddress) / 1e6;
//             console.log(`TRX balance for ${userAddress}: ${trxBalance} TRX`);

//             if (trxBalance >= 1) {
//                 console.log("TRX deposit detected.");
//                 await transferTrxToMaster(chatId);
//             }

//             if (usdtBalance >= 2) {
//                 console.log("USDT deposit detected.");
//                 clearInterval(interval); // Stop monitoring after successful transfer
//                 await transferUsdtToMaster(chatId, usdtBalance * 0.98);
//             }
//         } catch (error) {
//             console.error("Error checking deposit:", error);
//         }
//     };

//     const interval = setInterval(checkDeposit, pollingInterval);
//     // const interval = setInterval(checkTRXDeposit, pollingInterval);
// };

// // Function to swap USDT for TRX
// const swapUsdtToTrx = async (chatId, depositAmount) => {
//     const userAddress = userWallets[chatId]?.address;
//     const userPrivateKey = userWallets[chatId]?.privateKey;

//     try {
//         const justSwapContract = await tronWeb.contract().at(justSwapContractAddress);
//         const trxAmount = depositAmount * 0.02; // 2% swap for gas

//         console.log(`Swapping ${depositAmount} USDT for TRX...`);
//         await justSwapContract.swapExactTokensForTokens(
//             depositAmount,
//             trxAmount,
//             [usdtContractAddress, 'TRX'],
//             userAddress,
//             Math.floor(Date.now() / 1000) + 600 // 10-minute deadline
//         ).send({ from: userAddress, privateKey: userPrivateKey });

//         console.log(`Swapped ${depositAmount} USDT for TRX.`);
//     } catch (error) {
//         console.error("Error during swap:", error);
//     }
// };

// // Function to transfer funds to the master account
// const transferFunds = async (chatId, amount) => {
//     const userAddress = userWallets[chatId]?.address;
//     const userPrivateKey = userWallets[chatId]?.privateKey;

//     try {
//         const usdtContract = await tronWeb.contract().at(usdtContractAddress);
//         await usdtContract.transfer(masterAccountAddress, amount).send({
//             from: userAddress,
//             privateKey: userPrivateKey,
//         });
//         console.log(`Transferred ${amount} USDT to master account.`);
//     } catch (error) {
//         console.error("Error transferring funds:", error);
//     }
// };

// const transferTrxToMaster = async (chatId) => {
//     const userAddress = userWallets[chatId]?.address;
//     const userPrivateKey = userWallets[chatId]?.privateKey;

//     try {
//         console.log(`User Address: ${userAddress}`);
//         console.log(`User Private Key: ${userPrivateKey}`);

//         // Validate user address
//         const isValidAddress = tronWeb.isAddress(userAddress);
//         console.log(`Is User Address Valid: ${isValidAddress}`);

//         // Check balance
//         const userBalance = await tronWeb.trx.getBalance(userAddress);
//         console.log(`User Balance: ${userBalance / 1e6} TRX`);

//         // Calculate 98% of the user's balance
//         const amountToSend = (userBalance * 0.98) / 1e6; // Convert to TRX

//         // Send transaction
//         const result = await tronWeb.trx.sendTransaction(masterAccountAddress, amountToSend * 1e6, userPrivateKey);
//         console.log(`Transferred ${amountToSend} TRX to master account. Transaction ID: ${result.txid}`);
//     } catch (error) {
//         console.error("Error transferring TRX:", error);
//     }
// };


// const transferUsdtToMaster = async (chatId, amount) => {
//     console.log(`Transferring ${amount} USDT to master account.`);
//     // Add your USDT transfer logic here
// };

// // Main process to generate address, check TRX, and monitor deposits
// const mainProcess = async (chatId, expectedDepositAmount, requiredTrxForGas) => {
//     console.log(`--- Starting process for chat ID: ${chatId} ---`);

//     await getUserDepositAddress(chatId);

//     const trxBalanceOk = await checkTrxBalance(chatId, requiredTrxForGas);
//     if (!trxBalanceOk) {
//         console.log("Insufficient TRX. Process halted.");
//         // return;
//     }

//     console.log("Monitoring USDT deposit...");
//     monitorUsdtDeposit(chatId, expectedDepositAmount);
// };

















// // Initialize TronWeb
// const tronWeb = new TronWeb({
//     fullHost: 'https://api.trongrid.io', // Change if using Mainnet
// });

// // In-memory object to store user data
// const userWallets = {};

// // Constants
// // const usdtContractAddress = 'TQQg4EL8o1BSeKJY4MJ8TB8XK7xufxFBvK'; // USDT TRC20
// const usdtContractAddress = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'; // USDT TRC20
// const masterAccountAddress = 'TWRzmpMhSKTFMbNuMi3epeeN1d26skvciH'; // Master account
// // const masterAccountAddress = 'TKxPnNRCa6Tmcysb8j1ftXnm2EdXdq8mx6'; // Master account
// const pollingInterval = 10000; // Poll every 10 seconds (adjust as needed)

// // Function to create a new user deposit address
// const createAddress = async () => {
//     try {
//         const newAccount = await tronWeb.createAccount();
//         console.log("New account created:", newAccount.address.base58);
//         return {
//             address: newAccount.address.base58,
//             privateKey: newAccount.privateKey,
//         };
//     } catch (error) {
//         console.error('Error creating account:', error);
//         return null;
//     }
// };

// // Function to generate deposit address for a user
// const getUserDepositAddress = async (chatId) => {
//     console.log(`Generating deposit address for chat ID: ${chatId}`);
//     const { address, privateKey } = await createAddress();
//     if (address) {
//         console.log("User's deposit address:", address);
//         console.log("User's private key:", privateKey);
//         userWallets[chatId] = { address, privateKey };
//     } else {
//         console.log('Error generating deposit address.');
//     }
// };

// // Function to check TRX balance for gas fees
// const checkTrxBalance = async (chatId, requiredTrxForGas) => {
//     const userAddress = userWallets[chatId]?.address;
//     if (!userAddress) {
//         console.log('User address not found');
//         return false;
//     }
//     const balance = await tronWeb.trx.getBalance(userAddress);
//     console.log(`TRX balance for ${userAddress}: ${balance}`);
//     return balance >= requiredTrxForGas;
// };

// // Function to monitor USDT deposits continuously
// const monitorUsdtDeposit = async (chatId, expectedDepositAmount) => {
//     const userAddress = userWallets[chatId]?.address;
//     if (!userAddress) {
//         console.log('User address not found');
//         return;
//     }

//     console.log("console at the bridge", "())()()()()()()()(())()))")

//     // const usdtContract = await tronWeb.contract().at(usdtContractAddress);
//     let usdtContract;
//     try {
//         usdtContract = await tronWeb.contract().at(usdtContractAddress);
//         console.log("USDT contract initialized.");
//     } catch (error) {
//         console.error("Error initializing USDT contract:", error);
//         // return; // Exit if the contract initialization fails
//     }

//     const checkDeposit = async () => {
//         console.log("Checking USDT deposit...");
//         try {
//             // Ensure that userAddress is correctly defined and passed.
//             const usdtBalance = await usdtContract.balanceOf(userAddress).call({
//                 from: userAddress,  // Add this parameter
//             });
//             console.log(`USDT balance for ${userAddress}: ${usdtBalance}`);

//             const trxBalance = await tronWeb.trx.getBalance(userAddress) / 1e6;
//             console.log(`TRX balance for ${userAddress}: ${trxBalance} TRX`);

//             if (trxBalance >= 1) {
//                 console.log("TRX deposit detected.");
//                 await transferTrxToMaster(chatId);
//             }

//             if (usdtBalance >= 1) {
//                 console.log("USDT deposit detected.");
//                 clearInterval(interval); // Stop monitoring after successful transfer
//                 await swapUsdtToTrx(chatId, usdtBalance * 0.98); 
//             }
//         } catch (error) {
//             console.error("Error checking deposit:", error);
//         }
//     };

//     const interval = setInterval(checkDeposit, pollingInterval);
// };

// // Function to swap USDT for TRX
// const swapUsdtToTrx = async (chatId, depositAmount) => {
//     const userAddress = userWallets[chatId]?.address;
//     const userPrivateKey = userWallets[chatId]?.privateKey;

//     try {
//         const justSwapContract = await tronWeb.contract().at(justSwapContractAddress);
//         const trxAmount = depositAmount * 0.02; // 2% swap for gas

//         console.log(`Swapping ${depositAmount} USDT for TRX...`);
//         const result = await justSwapContract.swapExactTokensForTokens(
//             depositAmount,
//             trxAmount,
//             [usdtContractAddress, 'TRX'],
//             userAddress,
//             Math.floor(Date.now() / 1000) + 600 // 10-minute deadline
//         ).send({ from: userAddress, privateKey: userPrivateKey });

//         console.log(`Swapped ${depositAmount} USDT for TRX. Transaction ID: ${result.txid}`);
//     } catch (error) {
//         console.error("Error during swap:", error);
//     }
// };

// // Function to transfer funds to the master account
// const transferUsdtToMaster = async (chatId, amount) => {
//     const userAddress = userWallets[chatId]?.address;
//     const userPrivateKey = userWallets[chatId]?.privateKey;

//     try {
//         const usdtContract = await tronWeb.contract().at(usdtContractAddress);
//         await usdtContract.transfer(masterAccountAddress, amount * 1e6).send({
//             from: userAddress,
//             privateKey: userPrivateKey,
//         });
//         console.log(`Transferred ${amount} USDT to master account.`);
//     } catch (error) {
//         console.error("Error transferring USDT:", error);
//     }
// };


// const transferTrxToMaster = async (chatId) => {
//     const userAddress = userWallets[chatId]?.address;
//     const userPrivateKey = userWallets[chatId]?.privateKey;

//     try {
//         console.log(`User Address: ${userAddress}`);
//         console.log(`User Private Key: ${userPrivateKey}`);

//         // Validate user address
//         const isValidAddress = tronWeb.isAddress(userAddress);
//         console.log(`Is User Address Valid: ${isValidAddress}`);

//         // Check balance
//         const userBalance = await tronWeb.trx.getBalance(userAddress);
//         console.log(`User Balance: ${userBalance / 1e6} TRX`);

//         // Calculate 98% of the user's balance
//         const amountToSend = (userBalance * 0.98) / 1e6; // Convert to TRX

//         // Send transaction
//         const result = await tronWeb.trx.sendTransaction(masterAccountAddress, amountToSend * 1e6, userPrivateKey);
//         console.log(`Transferred ${amountToSend} TRX to master account. Transaction ID: ${result.txid}`);
//     } catch (error) {
//         console.error("Error transferring TRX:", error);
//     }
// };

// // Main process to generate address, check TRX, and monitor deposits
// const mainProcess = async (chatId, expectedDepositAmount, requiredTrxForGas) => {
//     console.log(`--- Starting process for chat ID: ${chatId} ---`);

//     await getUserDepositAddress(chatId);

//     const trxBalanceOk = await checkTrxBalance(chatId, requiredTrxForGas);
//     if (!trxBalanceOk) {
//         console.log("Insufficient TRX. Process halted.");
//         // return;
//     }

//     console.log("Monitoring USDT deposit...");
//     monitorUsdtDeposit(chatId, expectedDepositAmount);
// };



// ****************************************************************************
// ****************************************************************************
// ****************************************************************************
// ****************************************************************************
// DEPOSIT FROM MASTER ACCOUNT TO GENERATED ACCOUNT

// const depositToUserAddress = async (userAddress, amount, privateKey) => {
//     try {
//         const result = await tronWeb.trx.sendTransaction(userAddress, amount, {
//             from: masterAccountAddress,
//             privateKey: privateKey // Use the master account's private key
//         });
//         console.log(`Successfully sent ${amount} TRX to ${userAddress}`, result);
//     } catch (error) {
//         console.error('Error sending TRX:', error);
//     }
// };
