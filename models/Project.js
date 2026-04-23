import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
});

export default mongoose.model('Project', projectSchema);