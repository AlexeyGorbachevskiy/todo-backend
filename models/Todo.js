const {v1} = require('uuid');
const {Schema, model, Types} = require('mongoose');

const schema = new Schema({
    id: {type: String, default: v1},
    date: {type: Date, default: Date.now},
    name: {type: String},
    description: {type: String},
    tasks:[{ type: Object, ref: 'Task'}],
    owner: {type: Types.ObjectId, ref: 'User'},
})

module.exports = model('Todo', schema);
