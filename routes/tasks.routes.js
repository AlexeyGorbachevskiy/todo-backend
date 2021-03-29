const {Router} = require('express');
const Todo = require('../models/Todo');
const auth = require('../middleware/auth.middleware.ts');
const router = Router();
const User = require('../models/User');
const Task = require('../models/Task');

// params: todoId, taskId, name, description?, status?
// response: allTasks : Array
router.post('/', auth, async (req, res) => {
    try {
        const task = new Task({
            owner: req.user.userId,
            todoId: req.body.todoId,
            name: req.body.name,
            description: req.body.description,
            isCompleted: false,
        });
        await task.save();
        await Todo.findOne({id: req.body.todoId}).updateOne({$push: {tasks: task}},);
        await User.findOne({_id: req.user.userId})
            .updateOne({'todos.id': req.body.todoId}, {
                $push: {
                    'todos.$.tasks': task,
                }
            },);
        let allTasks = await Task.find({todoId: req.body.todoId, owner: req.user.userId});
        res.status(201).json({allTasks});
    } catch (e) {
        console.log(e);
        res.status(500).json({message: 'Error is occurred. Try again.'});
    }
});

// params: todoId, taskId, name, description?, status?
// response: allTasks : Array
router.put('/', auth, async (req, res) => {
    try {
        if (!req.body.name && !req.body.description && !req.body.isCompleted) {
            throw new Error();
        }
        await Task.findOne({id: req.body.taskId})
            .updateOne({
                $set: {
                    name: req.body.name,
                    description: req.body.description,
                    isCompleted: req.body.isCompleted ? req.body.isCompleted : false,
                }
            },);
        await Todo.findOne({id: req.body.todoId})
            .updateOne({'tasks.id': req.body.taskId}, {
                $set: {
                    'tasks.$.name': req.body.name,
                    'tasks.$.description': req.body.description,
                    'tasks.$.isCompleted': req.body.isCompleted,
                }
            },);
        await User.findOne({_id: req.user.userId})
            .findOneAndUpdate(
                {},
                {
                    "$set": {
                        [`todos.$[outer].tasks.$[inner].name`]: req.body.name ? req.body.name : Task.findOne({id: req.body.taskId}).name,
                        [`todos.$[outer].tasks.$[inner].description`]: req.body.description ? req.body.description : Task.findOne({id: req.body.taskId}).description,
                        [`todos.$[outer].tasks.$[inner].isCompleted`]: req.body.isCompleted ? req.body.isCompleted : Task.findOne({id: req.body.taskId}).isCompleted,
                    }
                },
                {
                    "arrayFilters": [{"outer.id": req.body.todoId}, {"inner.id": req.body.taskId}]
                },);
        let allTasks = await Task.find({todoId: req.body.todoId, owner: req.user.userId});
        res.status(201).json({allTasks});
    } catch (e) {
        console.log(e);
        res.status(500).json({message: 'Error is occurred. Try again.'});
    }
});


// params: todoId, taskId
// response: to do list with remaining tasks
router.delete('/', auth, async (req, res) => {
    try {
        await Task.findOneAndRemove({id: req.body.taskId});
        await Todo.findOne({id: req.body.todoId}).updateOne({}, {$pull: {'tasks': {id: req.body.taskId}}});
        await User.findOne({_id: req.user.userId})
            .updateOne({'todos.id': req.body.todoId}, {$pull: {'todos.$.tasks': {id: req.body.taskId}}});
        let remainingTasks = await Task.find({todoId: req.body.todoId, owner: req.user.userId});
        res.status(201).json({remainingTasks});
    } catch (e) {
        console.log(e);
        res.status(500).json({message: 'Error is occurred. Try again.'});
    }
});

module.exports = router;
