import mongoose from "mongoose"
import {v4 as uuidv4} from 'uuid'

export const CHAT_ROOM_TYPES = {
    CONSUMER_TO_CONSUMER: "consumer-to-consumer",
    CONSUMER_TO_SUPPORT: "consumer-to-support",
}

const chatRoomSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: ()=> uuidv4().replace(/\-/g, '')
    },
    userIds: Array,
    type: String,
    chatInitiator: String
},{
    timestamps: true,
    versionKey: false,
    collection: 'chatrooms'
})
// chatInitiator: the user who created the chat room, userIds: array of users, type: type of chatroom
//  either returning an existing chatroom document or creating a new one
chatRoomSchema.statics.initiateChat = async function(userIds, type, chatInitiator){
    try{
        const avaliableRoom = await this.findOne({
            userIds: {
                $size: userIds.length,
                $all: [...userIds]
            },
            type,
        })

        if(avaliableRoom){
            return {
                isNew : false,
                message: 'retrieving an old chat room',
                chatRoomId: avaliableRoom._doc._id,
                type: avaliableRoom._doc.type
            }
        }

        const newRoom = await this.create({ userIds, type, chatInitiator })
        return {
            isNew: true,
            message: 'creating a new chatroom',
            chatRoomId: newRoom._doc._id,
            type: newRoom._doc.type,
        }

    }catch(error){
        console.log('error on start chat method', error);
        throw error;
    }
}

export default mongoose.model('ChatRoom', chatRoomSchema)