const express = require('express');
const router = express.Router();
const depositModel = require('../models/deposit_md');

router.get("/", async (req, res) => {
    try {
        let deposits = await depositModel
            .find()
            .sort({ depositedAt: -1 })
            .lean()
        res.send(deposits)
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error")
    }
});


// POST route to create a new deposit
router.post('/', async (req, res) => {
    try {
        const { userId, amount, privateKey, publicKey, coin } = req.body; // Destructure input data

        // Validate required fields
        if (!userId || !amount || !privateKey || !publicKey || !coin) {
            return res.status(400).send('Missing required fields');
        }

        // Create and save the new deposit
        const newDeposit = new depositModel({ // Use depositModel here
            userId,
            amount,
            privateKey,
            publicKey,
            coin,
        });

        console.log("Saving deposit:", newDeposit);
        await newDeposit.save();

        return res.status(201).json(newDeposit); // Send the saved deposit back as a response
    } catch (error) {
        console.error('Error saving deposit:', error);
        return res.status(500).send('Internal server error');
    }
});


// DELETE route to delete a specific deposit by ID
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedDeposit = await depositModel.findByIdAndDelete(id);

        if (!deletedDeposit) {
            return res.status(404).send('Deposit not found');
        }

        res.status(200).json({ message: 'Deposit deleted', deposit: deletedDeposit });
    } catch (error) {
        console.error('Error deleting deposit:', error);
        res.status(500).send('Internal server error');
    }
});


// DELETE route to delete all deposits
router.delete('/', async (req, res) => {
    try {
        await depositModel.deleteMany({});
        res.status(200).json({ message: 'All deposits deleted' });
    } catch (error) {
        console.error('Error deleting all deposits:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router