const {Router} = require('express');
const Todo = require('../models/Todo');
const auth = require('../middleware/auth.middleware.ts');
const router = Router();
const User = require('../models/User');
const Task = require('../models/Task');

// params: ---
// response: all todos - Array
router.get('/', auth, async (req, res) => {
    try {
        const todos = await Todo.find({owner: req.user.userId});
        res.json(todos);
    } catch (e) {
        res.status(500).json({message: 'Error is occurred. Try again.'});
    }
});

// params: name: String, description: string, todoId: string
// response: all todos - Array
router.post('/', auth, async (req, res) => {
    try {
        const todo = new Todo({
            owner: req.user.userId, name: req.body.name, description: req.body.description
        });
        await todo.save();
        await User.findOne({_id: req.user.userId}).updateOne({$push: {todos: todo}},);
        let allTodos = await Todo.find({})
        res.status(201).json({allTodos});
    } catch (e) {
        res.status(500).json({message: 'Error is occurred. Try again.'});
    }
});

// params: name: String, description: string, todoId: string
// response: all todos - Array
router.put('/', auth, async (req, res) => {
    try {
        if (!req.body.name || !req.body.todoId) {
            throw new Error();
        }
        await Todo.findOne({id: req.body.todoId})
            .updateOne({$set: {name: req.body.name}},);
        await User.findOne({_id: req.user.userId})
            .updateOne({'todos.id': req.body.todoId}, {
                $set: {
                    'todos.$.name': req.body.name,
                    'todos.$.description': req.body.description ? req.body.description : Todo.findOne({id: req.body.todoId}).description,
                }
            },);
        let allTodos = await Todo.find({})
        res.status(201).json({allTodos});
    } catch (e) {
        res.status(500).json({message: 'Error is occurred. Try again.'});
    }
});


// params: todoId: string
// response: remaining todos: Array
router.delete('/', auth, async (req, res) => {
    try {
        await Task.deleteMany({todoId: req.body.todoId});
        await Todo.findOneAndRemove({id: req.body.todoId});
        await User.findOne({_id: req.user.userId}).updateOne({}, {$pull: {'todos': {id: req.body.todoId}}});
        let remainingTodos = await Todo.find({});
        res.status(201).json({remainingTodos});
    } catch (e) {
        console.log(e);
        res.status(500).json({message: 'Error is occurred. Try again.'});
    }
});

module.exports = router;
