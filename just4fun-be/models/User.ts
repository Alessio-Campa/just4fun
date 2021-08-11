import * as mongoose from 'mongoose'
import * as crypto from 'crypto'

export interface User extends mongoose.Document{
    username: string,
    mail: string,
    points: number,
    friends: string[],
    friendRequests: string[]
    roles: string[],
    salt: string,
    digest: string,

    setPassword: (pwd:string)=>void,
    validatePassword: (pwd:string)=>boolean,
    hasAdminRole: ()=> boolean,
    setAdmin: (value:boolean)=>void,
    hasModeratorRole: ()=> boolean,
    setModerator: (value:boolean)=>void,
    follow: (followed:string)=>Promise<any>,
    sendFriendRequest: (receiver:string)=>Promise<any>,
    acceptFriendRequest: (requester:string)=>object
}

let userSchema = new mongoose.Schema<User>({
    username: {
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: true
    },
    mail: {
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: true
    },
    points: {
        type: mongoose.SchemaTypes.Number,
        required: true,
        default: 0
    },
    friends: {
        type: [mongoose.SchemaTypes.String],
        required: true,
        default: []
    },
    friendRequests: {
        type: [mongoose.SchemaTypes.String],
        required: true,
        default: []
    },
    roles: {
        type: [mongoose.SchemaTypes.String],
        required: true,
        default: []
    },
    salt: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    digest: {
        type: mongoose.SchemaTypes.String,
        required: false
    }

})

userSchema.methods.setPassword = function( pwd:string ){
    this.salt = crypto.randomBytes(16).toString('hex');

    let hmac = crypto.createHmac('sha512', this.salt);
    hmac.update( pwd );
    this.digest = hmac.digest('hex');
}

userSchema.methods.validatePassword = function(pwd: string): boolean{
    let hmac = crypto.createHmac('sha512', this.salt);
    hmac.update( pwd );
    let digest = hmac.digest('hex');

    return (this.digest === digest)
}

userSchema.methods.hasAdminRole = function(): boolean {
    return this.roles.includes('ADMIN');
}

userSchema.methods.setAdmin = function(value:boolean) {
    if (value) {
        this.roles.push('ADMIN');
    }
    else {
        let index = this.roles.indexOf('ADMIN');
        if(index !== -1)
            this.roles.splice(index, 1);
    }
}

userSchema.methods.hasModeratorRole = function(): boolean {
    return this.roles.includes('MODERATOR');
}

userSchema.methods.setModerator = function(value:boolean) {
    if (value) {
        this.roles.push('MODERATOR');
    }
    else {
        let index = this.roles.indexOf('MODERATOR');
        if(index !== -1)
            this.roles.splice(index, 1);
    }
}

userSchema.methods.follow = function (followed: string): Promise<any>{
    let user = this
    return getModel().findOne({mail: followed}).lean().then(data => {
        if (!data)
            return {statusCode: 400, error: true, errormessage: "User doesn't exist"};
        if (user.mail === data.mail)
            return {statusCode: 400, error: true, errormessage: "That's cute, but you can't be friend with yourself"};
        if (user.friends.includes(followed))
            return {statusCode: 400, error: true, errormessage: "User is already friend"};
        user.friends.push(followed);
        return null
    }).catch(err => {
        return {statusCode: 400, error: true, errormessage: err};
    })
}

userSchema.methods.sendFriendRequest = function (receiver: string): Promise<any>{
    let user = this;
    return getModel().findOne({mail: receiver}).then(data => {
        if (!data)
            return {statusCode: 400, error: true, errormessage: "User doesn't exist"};
        if (user.mail === data.mail)
            return {statusCode: 400, error: true, errormessage: "That's cute, but you can't be friend with yourself"};
        if (data.friends.includes(user.mail))
            return {statusCode: 400, error: true, errormessage: "Users are already friends"};
        if (data.friendRequests.includes(user.mail))
            return {statusCode: 400, error: true, errormessage: "Friend request already sent"};

        if (!user.friends.includes(receiver))
            user.friends.push(receiver);
        data.friendRequests.push(user.mail);
        data.save();
        return null;
    }).catch(err => {
        return {statusCode: 400, error: true, errormessage: err};
    })
}

userSchema.methods.acceptFriendRequest = function (requester: string): object{
    let user = this;
    if (user.friendRequests.includes(requester)){
        let idx = user.friendRequests.indexOf(requester)
        user.friendRequests.splice(idx, 1);
        if (!user.friends.includes(requester))
            user.friends.push(requester);
        console.log(user)
        return null;
    }
    else
        return {statusCode: 400, error: true, errormessage: "User doesn't exist or didn't send a friend request"};
}


export function getSchema() { return userSchema; }

let userModel: mongoose.Model <User> = mongoose.model('User', getSchema());
export function getModel(): mongoose.Model <User> {
    return userModel;
}

export function newUser (mail: string, username: string): User{
    let userModel = getModel();
    return new userModel({"mail":mail, "username":username});
}


