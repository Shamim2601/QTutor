const mongoose = require('mongoose');

const connectDB = async()=>{
    try {
        mongoose.set('strictQuery', false);
        const conn = await mongoose.connect('mongodb+srv://shamim2601:6EkN3FJrQWhgoMX9@cluster0.o0etpjc.mongodb.net/qtutor');
        console.log(`Database connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(error);
    }
}

module.exports = connectDB;
