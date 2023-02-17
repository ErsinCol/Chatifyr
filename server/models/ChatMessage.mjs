import mongoose from "mongoose"
import {v4 as uuidv4} from 'uuid'

const MESSAGE_TYPES = {
    TYPE_TEXT: 'text'
}

const readByRecipientSchema = new mongoose.Schema({
    _id: false, 
    readByUserId: String,
    readAt: {
        type: Date,
        default: Date.now()
    }
},{
    timestamps: false,
    versionKey: false,
})

const chatMessageSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: ()=>uuidv4().replace(/\-/g,'')
    },
    chatRoomId: String,
    message: mongoose.Schema.Types.Mixed,
    type: {
        type: String,
        default: ()=> MESSAGE_TYPES.TYPE_TEXT
    },
    postedByUser: String,
    readByRecipients: [readByRecipientSchema]
},{
    timestamps: true,
    versionKey: false,
    collection: 'chatmessages'
})

chatMessageSchema.statics.createPostInChatRoom = async function(chatRoomId, message, postedByUser){
    try {
        const post = await this.create({chatRoomId, message, postedByUser, readByRecipients:{readByUserId:postedByUser}})
        const aggregate = await this.aggregate([
            
                //* get post where _id = post._id
                {
                    $match : {
                    _id: post.id
                    }
                },
                //* do a join on another table called users, and get me a user whose _id = postedByUser
                {
                    $lookup : {
                        from: 'users',
                        localField: 'postedByUser',
                        foreignField: '_id',
                        as: 'postedByUser'
                    }
                },
                {
                    $unwind: '$postedByUser' 
                },
                //* do a join on another table called chatrooms, and  get me a chatroom whose _id = chatRoomId
                {
                    $lookup: {
                        from : 'chatrooms',
                        localField : 'chatRoomId',
                        foreignField: '_id',
                        as: 'chatRoomInfo'
                    }
                },
                {
                    $unwind: '$chatRoomInfo'
                },
                {
                    $unwind: '$chatRoomInfo.userIds'
                },
                //* do a join on another table called users, and get me a user whose _id = userIds
                {
                    $lookup: {
                        from: 'users',
                        localField: 'chatRoomInfo.userIds',
                        foreignField: '_id',
                        as: 'chatRoomInfo.userProfile'
                    }
                },
                {
                    $unwind: '$chatRoomInfo.userProfile'
                },
                //*  group data
                {
                    $group: {
                        _id: '$chatRoomInfo._id',
                        postId: {$last: '$_id'},
                        chatRoomId: {$last: '$chatRoomInfo._id'},
                        message: {$last: '$message'},
                        type: { $last: '$type'},
                        postedByUser: { $last: '$postedByUser' },
                        readByRecipients: { $last: '$readByRecipients' },
                        chatRoomInfo: { $addToSet: '$chatRoomInfo.userProfile' },
                        createdAt: { $last: '$createdAt' },
                        updatedAt: { $last: '$updatedAt' },
                    }
                } 
        ])
        return aggregate[0]
    } catch (error) {
        throw error
    }
}

chatMessageSchema.statics.getConversationByRoomId = async function(chatRoomId, options = {}){
    try {
        return this.aggregate([
            {
                $match: {chatRoomId}
            },
            {
                $sort: {createdAt: -1}
            },
            //* do a join on another table called users, and get me a user whose _id = postedByUser
            {
                $lookup: {
                    from: 'users',
                    localField: 'postedByUser',
                    foreignField: '_id',
                    as: 'postedByUser'
                }
            },
            {
                $unwind: '$postedByUser'
            },
            //* apply pagination 
            {
                $skip: options.page * options.limit
            },
            {
                $limit: options.limit
            },
            {
                $sort: {createdAt: 1}
            }
        ])
    } catch (error) {
        throw error
    }
}

chatMessageSchema.statics.markMessageRead = async function(chatRoomId, currentUserOnlineId){
    try {
        return this.updateMany(
            {
                chatRoomId,
                'readByRecipients.readByUserId': { $ne : currentUserOnlineId}
            },
            {
                $addToSet: {
                    readByRecipients: {readByUserId: currentUserOnlineId}
                }
            },
            {
                multi: true
            }
        )
    } catch (error) {
        throw error
    }
}

chatMessageSchema.statics.getRecentConversation = async function (chatRoomIds, options, currentUserOnlineId) {
    try {
      return this.aggregate([
        { $match: { chatRoomId: { $in: chatRoomIds } } },
        {
          $group: {
            _id: '$chatRoomId',
            messageId: { $last: '$_id' },
            chatRoomId: { $last: '$chatRoomId' },
            message: { $last: '$message' },
            type: { $last: '$type' },
            postedByUser: { $last: '$postedByUser' },
            createdAt: { $last: '$createdAt' },
            readByRecipients: { $last: '$readByRecipients' },
          }
        },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: 'users',
            localField: 'postedByUser',
            foreignField: '_id',
            as: 'postedByUser',
          }
        },
        { $unwind: "$postedByUser" },
        {
          $lookup: {
            from: 'chatrooms',
            localField: '_id',
            foreignField: '_id',
            as: 'roomInfo',
          }
        },
        { $unwind: "$roomInfo" },
        { $unwind: "$roomInfo.userIds" },
        {
          $lookup: {
            from: 'users',
            localField: 'roomInfo.userIds',
            foreignField: '_id',
            as: 'roomInfo.userProfile',
          }
        },
        { $unwind: "$readByRecipients" },
        {
          $lookup: {
            from: 'users',
            localField: 'readByRecipients.readByUserId',
            foreignField: '_id',
            as: 'readByRecipients.readByUser',
          }
        },
  
        {
          $group: {
            _id: '$roomInfo._id',
            messageId: { $last: '$messageId' },
            chatRoomId: { $last: '$chatRoomId' },
            message: { $last: '$message' },
            type: { $last: '$type' },
            postedByUser: { $last: '$postedByUser' },
            readByRecipients: { $addToSet: '$readByRecipients' },
            roomInfo: { $addToSet: '$roomInfo.userProfile' },
            createdAt: { $last: '$createdAt' },
          },
        },
        { $skip: options.page * options.limit },
        { $limit: options.limit },
      ]);
    } catch (error) {
      throw error;
    }
}

export default mongoose.model('ChatMessage', chatMessageSchema)