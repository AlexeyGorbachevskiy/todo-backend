const {v1} = require('uuid');
const {Schema, model, Types} = require('mongoose');

const schema = new Schema({
    id: {type: String, default: v1},
    date: {type: Date, default: Date.now},
    name: {type: String},
    description: {type: String},
    isCompleted:{type: Boolean, default: false},
    todoId: {type: String, ref: 'Todo'},
    owner: {type: Types.ObjectId, ref: 'User'},
})

module.exports = model('Task', schema);
