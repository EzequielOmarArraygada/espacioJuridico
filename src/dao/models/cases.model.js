import mongoose from 'mongoose';

const casesSchema = new mongoose.Schema({
    case_number: {
        type: String,
        required: true,
        unique: true 
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    assigned_lawyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'lawer', 
    },
    documents: [{
        category: { 
            type: String,
            required: true
        },
        files: [{
            name: {
                type: String,
                required: true
            },
            reference: { 
                type: String,
                required: true
            },
            upload_date: {
                type: Date,
                default: Date.now
            }
        }]
    }],
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

casesSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

const cases = mongoose.model('cases', casesSchema);

export default cases;