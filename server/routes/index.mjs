import express from 'express'
// controllers 
import users from '../controllers/user.mjs'
// middlewares
import { encode } from '../middlewares/jwt.mjs'

const router = express.Router()

router
    .post('/login/:userId', encode, (req, res, next) => { // because moving forward they'll need a token to access the rest of chat APIs
        return res.status(200).json({
            success: true,
            authorization: req.authToken
        })
    })

export default router






