//* web-socket class that will manage sockets for us
class WebSockets {
    users = [] //  have an empty users array, This array will hold a list of all the active users that are online using our application.
    
    connection(client){ // client here will be our server instance
        // when a user connection is lost 
        client.on('disconnect', ()=>{
            this.users = this.users.filter( (user) => user.socketId !== client.id )
        })
        // when user logs in from the front end they will make a connection with our server by giving their identity
        client.on('identity', (userId)=>{
            this.users.push({
                socketId: client.id,
                userId: userId
            })
        })
        // when a user joins a chat room
        client.on('subscribe', (room, otherUserId = '')=>{
            this.subscribeOtherUser(room, otherUserId)
            client.join(room)
        })
        // when a user leaves or wants to mute a chat room
        client.on('unsubscribe', (room)=>{
            client.leave(room)
        })
    }

    /*
        Another thing we could have done here was when the user sends in the room number,
        we can make a DB query to see all the members of the chat room and make them join
        if they are online at the moment (that is, in our users list).
    */

    subscribeOtherUser(room, otherUserId){
        // Well, think of a scenario where the same user is logged in from both their web application and mobile phone. It will create multiple socket connections for the same user.
        const userSockets = this.users.filter((user)=> user.userId === otherUserId)
        userSockets.map((userInfo)=>{
            const socketConn = global.io.sockets.connected(userInfo.socketId)
            if(socketConn){
                socketConn.join(room)
            }
        })
    }
}

export default new WebSockets()