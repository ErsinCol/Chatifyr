import express from 'express'
// controllers 
import users from '../controllers/user.mjs'
// middlewares
import { encode } from '../middlewares/jwt.mjs'

const router = express.Router()

router
    .post('/login/:userID', encode, (req, res, next) => {})

export default router



