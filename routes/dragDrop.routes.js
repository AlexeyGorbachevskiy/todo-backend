const {Router} = require('express');
const Todo = require('../models/Todo');
const auth = require('../middleware/auth.middleware.ts');
const router = Router();
const User = require('../models/User');
const Task = require('../models/Task');


// params: todoId, taskId
// response: to do list with remaining tasks
router.put('/', auth, async (req, res) => {
    try {
        if (
            !req.body.currentTodoId
            || !req.body.currentTaskId
            || !req.body.targetTodoId
            || (!req.body.targetTaskIndex && req.body.targetTaskIndex !== 0)
            || !req.body.name
        ) {
            throw new Error('No request parameters');
        }
        await Task.findOneAndRemove({id: req.body.currentTaskId});
        await Todo.findOne({id: req.body.currentTodoId}).updateOne({}, {$pull: {'tasks': {id: req.body.currentTaskId}}});
        await User.findOne({_id: req.user.userId})
            .updateOne({'todos.id': req.body.currentTodoId}, {$pull: {'todos.$.tasks': {id: req.body.currentTaskId}}});


        const task = new Task({
            owner: req.user.userId,
            // id: req.body.currentTaskId,
            todoId: req.body.targetTodoId,
            name: req.body.name,
            description: req.body.description,
            isCompleted: req.body.isCompleted,
        });

        await task.save();
        await Todo.findOne({id: req.body.targetTodoId})
            .updateOne({
                $push: {
                    tasks: {
                        $each: [task],
                        $position: req.body.targetTaskIndex
                    }
                }
            });
        await User.findOne({_id: req.user.userId})
            .updateOne({'todos.id': req.body.targetTodoId}, {
                $push: {
                    'todos.$.tasks': {
                        $each: [task],
                        $position: req.body.targetTaskIndex
                        // req.body.targetTaskIndex===0 ?  req.body.targetTaskIndex + 1 : req.body.targetTaskIndex - 1
                    }
                }
            },);
        let allTodos = await Todo.find({});


        res.status(201).json({allTodos});
    } catch (e) {
        console.log(e);
        res.status(500).json({message: 'Error is occurred. Try again.'});
    }
});

module.exports = router;
