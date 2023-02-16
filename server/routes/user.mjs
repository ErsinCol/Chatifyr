import express from 'express';
// controllers
import user from '../controllers/user.mjs'

const router = express.Router()


router
    .get('/', user.onGetAllUsers)
    .post('/', user.onCreateUser)
    .get('/:id', user.onGetUserById)
    .delete('/:id', user.onDeleteUserById)

export default router