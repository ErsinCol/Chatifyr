import jwt from 'jsonwebtoken'
// models 
import UserModel from '../models/User.mjs'

const SECRET_KEY = 'some-secret-key'

export const encode = async (req, res, next) =>{
    try {
        const { userId }  = req.params
        const user = await UserModel.getUserById(userId)
        const payload = {
            userId : user._id,
            userType : user.type
        }
        const authToken = jwt.sign(payload, SECRET_KEY )
        console.log('Auth', authToken)
        req.authToken = authToken
        next()
    } catch (error) {
        return res.status(400).json({ success: false, message: error.error });
    }
}

export const decode = (req, res, next) =>{
    if(!req.headers['authorization']){
        return res.status(400).json({success: false, message: 'no access token provided'})
    }
    const accessToken = req.headers.authorization.split(' ').toString()
    try {
        const decoded = jwt.verify(accessToken, SECRET_KEY)
        req.userId = decoded.userId
        req.userType = decoded.type // error olabilir
        return next()
    } catch (error) {
        return res.status(401).json({ success: false, message: error.message });
    }
}