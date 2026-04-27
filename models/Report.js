import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    username: { type: String, required: true },
    projectName: { type: String, required: true },
    role: { type: String, default: 'Developer' },
    updates: { type: String, required: true },
    plans: { type: String, required: true },
    impediments: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now }
});

export default mongoose.model('Report', reportSchema);