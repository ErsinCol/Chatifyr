import makeValidation from '@withvoid/make-validation'
import ChatRoomModel, { CHAT_ROOM_TYPES } from '../models/ChatRoom.mjs'
export default {
    getRecentConversation: async (req, res) => {},
    getConversationByRoomId: async (req, res) => {},
    initiate: async (req, res) => {
        try {
            const validation = makeValidation(types=>({
                payload: req.body,
                checks: {
                    userIds: {
                        type: types.array,
                        options: {unique: true, empty: false, stringOnly: true}
                    },
                    type: {type: types.enum, options:  {enum: Object.values(CHAT_ROOM_TYPES)} }
                }
            }))
            if(!validation.success) return res.status(400).json({...validation})

            const { userIds, type } = req.body 
            const { userId: chatInitiator} = req
            const allUserIds = [...userIds, chatInitiator]
            const chatRoom = await ChatRoomModel.initiateChat(allUserIds, type, chatInitiator)
            return res.status(200).json({success: true, chatRoom})
        } catch (error) {
            return res.status(500).json({success: false, error: error})
        }
    },
    postMessage: async (req, res) => {},
    markConversationReadByRoomId: async (req, res) => {}
}