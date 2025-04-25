import mongoose from 'mongoose';
import { CasesManagerMongo } from '../services/managers/CasesManagerMongo.js';
import bcrypt from 'bcrypt';

const lawerSchema = new mongoose.Schema({
    first_name: {
        type: String,
    },
    last_name: {
        type: String,
    },
    email: {
        type: String,
        unique: true
    },
    age: {
        type: Number,
    },
    password: {
        type: String,
    },
    Cases: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cases'
    },
    role: { type: String, enum: ['lawer','admin'], default: 'lawer' },
    documents: [{
        name: String,
        reference: String
    }],
    last_connection:{ type: Date, }
});

lawerSchema.post('save', async function (doc, next) {
    try {

        if (doc.role === 'lawer' && !doc.Cases) {
            const CasesManager = new CasesManagerMongo();
            const newCases = await CasesManager.addCases();
            doc.Cases = newCases._id;
            await doc.save();
        }
        next();
    } catch (error) {
        next(error);
    }
});

lawerSchema.methods.isPasswordSame = async function(newPassword) {
    return await bcrypt.compare(newPassword, this.password);
}

lawerSchema.methods.hashPassword = async function(newPassword) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(newPassword, salt);
}


const Lawer = mongoose.model('lawer', lawerSchema);

export default Lawer;

