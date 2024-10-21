const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const bot = require('./bot');

// routes
const depositRoute = require('./routes/depositRoute');
const adminRoute = require('./routes/adminRoute');

const app = express();
const path = require('path');
const PORT = process.env.PORT || 4000;

const http = require('http');
const server = http.createServer(app);
app.use(express.urlencoded({ extended: true }));


// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(cors({ origin: '*' }));
mongoose.set("strictQuery", true);

app.get('/', (req, res) => {
    res.send(`<h1>Hello! server is running port ${PORT} </h1>`);
});
app.use("/api/deposit", depositRoute);
app.use("/api/admin", adminRoute);


// Connect to MongoDB
const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB:', process.env.MONGODB_URI); // Log URI for verification
        await mongoose.connect(process.env.MONGODB_URI);
        server.listen(PORT, () => {
            console.log(`app is listening on port ${PORT}`);
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); // Exit the process if the connection fails
    }
};

connectDB()