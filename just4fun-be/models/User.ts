import * as mongoose from 'mongoose'
import * as crypto from 'crypto'
import {Match} from "./Match";
import {getIoServer} from "../bin/socket";

export interface User extends mongoose.Document{
    username: string,
    email: string,
    points: number,
    following: string[],
    friends: string[],
    friendRequests: string[],
    matchInvites: string[],
    roles: string[],
    salt: string,
    digest: string,
    isPasswordTemporary: boolean,
    avatar: string,
    isDeleted: boolean,
    notifications: {
        type: string,
        content: Object,
    }[],

    setPassword: (pwd:string, temporary?:boolean)=>void,
    validatePassword: (pwd:string)=>boolean,
    hasModeratorRole: ()=> boolean,
    setModerator: (value:boolean)=>void,
    follow: (followed:string, res, next)=>void,
    unfollow: (followed:string, res, next)=>void,
    sendFriendRequest: (receiver:string, res, next)=>void,
    acceptFriendRequest: (requester:string, res, next)=>void,
    refuseFriendRequest: (refused: string, res, next)=>void,
    removeFriendRequest: (user: string, res, next)=>void,
    removeFriend: (user: string, res, next)=>void,
    updatePoints: (loserEmail)=>void,
    notify: (notification, save?: boolean) => void
}

export function isUser(arg): arg is User{
    return true;
}

let userSchema = new mongoose.Schema<User>({
    username: {
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: true
    },
    email: {
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: true
    },
    points: {
        type: mongoose.SchemaTypes.Number,
        required: true,
        default: 0
    },
    following: {
        type: [mongoose.SchemaTypes.String],
        required: true,
        default: []
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
    matchInvites: {
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
    },
    isPasswordTemporary: {
        type: mongoose.SchemaTypes.Boolean,
        required: false
    },
    avatar: {
        type: String,
        required: false
    },
    isDeleted: {
        type: Boolean,
        required: false,
        default: false
    },
    notifications: [{
        type: {
            type: mongoose.SchemaTypes.String,
            enum: ['follow', 'request', 'invite', 'acceptedInvite', 'message', 'system'],
            required: true
        },
        content: {
            type: mongoose.SchemaTypes.Mixed,
            required: true
        }
    }]

})

userSchema.methods.setPassword = function(pwd:string, temporary:boolean = false) {
    this.isPasswordTemporary = temporary;
    this.salt = crypto.randomBytes(16).toString('hex');

    let hmac = crypto.createHmac('sha512', this.salt);
    hmac.update( pwd );
    this.digest = hmac.digest('hex');
}

userSchema.methods.validatePassword = function(pwd: string): boolean {
    let hmac = crypto.createHmac('sha512', this.salt);
    hmac.update( pwd );
    let digest = hmac.digest('hex');

    return (this.digest === digest)
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

userSchema.methods.follow = function (followed: string, res, next) {
    let user = this
    return getModel().findOne({email: followed}).then((data: User) => {
        let isF = isFollowable(user, data, "follow");
        if (!isF[0])
            throw new Error(isF[1]);

        user.following.push(followed);

        data.notify({type: 'follow', content: user.email});
        user.save().then(() => next({statusCode: 200, error: false, message: "Update successful"}));
    }).catch(err => {
        next( {statusCode: 400, error: true, errormessage: err.message} );
    })
}

userSchema.methods.unfollow = function (unfollowed: string, res, next) {
    let user = this;
    return getModel().findOne({email: unfollowed}).lean().then(data => {
        let isF = isFollowable(user, data, "unfollow");
        if (!isF[0])
            throw new Error(isF[1]);

        let idx = user.following.indexOf(unfollowed)
        user.following.splice(idx, 1);

        user.save().then(() => next({statusCode: 200, error: false, message: "Update successful"}));
    }).catch(err => {
        next( {statusCode: 400, error: true, errormessage: err.message} );
    });
}

userSchema.methods.sendFriendRequest = function (receiver: string, res, next) {
    let user = this;
    return getModel().findOne({email: receiver}).then(data => {
        if (!data)
            throw new Error("User doesn't exist");
        if (user.email === data.email)
            throw new Error("That's cute, but you can't be friend with yourself");
        if (data.friends.includes(user.email))
            throw new Error("Users are already friends");
        if (data.friendRequests.includes(user.email))
            throw new Error("Friend request already sent");

        data.friendRequests.push(user.email);
        data.notify({type: 'request', content: user.email}, false);
        data.save().then(() => next({statusCode: 200, error: false, message: "Update successful"}));
    }).catch(err => {
        next({statusCode: 400, error: true, errormessage: err.message});
    });
}

userSchema.methods.acceptFriendRequest = function (requester: string, res, next) {
    let user = this;
    if (user.friendRequests.includes(requester)) {
        getModel().findOne({email: requester}).then(data => {
            let idx = user.friendRequests.indexOf(requester)
            user.friendRequests.splice(idx, 1);
            user.friends.push(requester);

            if (data.friends.includes(user.email))
                throw new Error("Request already accepted")
            data.friends.push(user.email);

            data.save();
            user.save().then(() => next({statusCode: 200, error: false, message: "Update successful"}));
        }).catch(err => {
            next({statusCode: 500, error: true, errormessage: err.message})
        })
    }
    else {
        next({statusCode: 400, error: true, errormessage: "User doesn't exist or didn't send a friend request"});
    }
}

userSchema.methods.refuseFriendRequest = function (refused: string, res, next){
    if (this.friendRequests.includes(refused)){
        let idx = this.friendRequests.indexOf(refused);
        this.friendRequests.splice(idx, 1);

        this.save().then(()=>{
            next({statusCode: 200, error: false, message: "Update successful"});
        }).catch(err => {
            next({statusCode: 500, error: true, errormessage: err.message});
        })
    } else {
        next({statusCode: 400, error: true, errormessage: "User doesn't exist or didn't send a friend request"});
    }
}

userSchema.methods.removeFriendRequest = function (user: string, res, next){
    getModel().findOne({email: user}).then((data) => {
        data.refuseFriendRequest(this.email, res, next);
    }).catch((err) => {
        next({statusCode: 500, error: true, errormessage: "DB error: "+err.errormessage});
    });
}

userSchema.methods.removeFriend = function (friend: string, res, next){
    let user = this;
    if (!user.friends.includes(friend))
        return next({statusCode: 400, error: true, errormessage: "User doesn't exist or isn't your friend"});

    getModel().findOne({email: friend}).then(data => {
        let idx = user.friends.indexOf(friend);
        user.friends.splice(idx, 1);

        idx = data.friends.indexOf(user.email);
        data.friends.splice(idx, 1);

        data.save();
        user.save().then(() => {
            next({statusCode: 200, error: false, message: "Update successful"});
        }).catch(err => {
            next({statusCode: 500, error: true, message: err});
        })
    }).catch(err => {
        next({statusCode: 500, error: true, message: err});
    });
}

userSchema.methods.updatePoints = function (loserEmail){
    getModel().findOne({email: loserEmail}).then((loser) => {
        let newPoints = Math.round(20 + ((loser.points - this.points)/10));
        if (newPoints <= 10) newPoints = 10;
        if (newPoints >= 30) newPoints = 30;
        this.points += newPoints;
        loser.points -= newPoints;
        if (loser.points < 0) loser.points = 0;
        this.save().then(()=> loser.save());
    });
}

userSchema.methods.notify = function (notification, save = true): void{
    let ios = getIoServer();
    let message = {
        subject: "newNotification"
    };
    this.notifications.push({
        type: notification.type,
        content: notification.content,
    });
    ios.to(this.email).emit('broadcast', message);
    console.log("socket notification sended".red)
    if (save)
        this.save();
}

export function getSchema() { return userSchema; }

let userModel: mongoose.Model <User> = mongoose.model('User', getSchema());
export function getModel(): mongoose.Model <User> {
    return userModel;
}

export function newUser (email: string, username: string, avatar: string): User{
    let userModel = getModel();
    return new userModel({"email": email, "username": username, "avatar": avatar});
}

// utilities
function isFollowable(user, followed, action): [boolean, string] {
    if (!followed)
        return [false, "User doesn't exist"];
    if (user.email === followed.email)
        return [false, "That's cute, but you can't follow yourself"];
    if ( action === "follow" && user.following.includes(followed.email) )
        return [false, "User is already followed"];
    if ( action === "unfollow" && !user.following.includes(followed.email) )
        return [false, "User is not followed"];
    return [true, ""];
}


