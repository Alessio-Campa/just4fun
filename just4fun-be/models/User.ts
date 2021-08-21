import * as mongoose from 'mongoose'
import * as crypto from 'crypto'
import {Match} from "./Match";

export interface User extends mongoose.Document{
    username: string,
    email: string,
    points: number,
    following: string[],
    friends: string[],
    friendRequests: string[]
    roles: string[],
    salt: string,
    digest: string,
    isPasswordTemporary: boolean,
    avatar: string,

    setPassword: (pwd:string, temporary?:boolean)=>void,
    validatePassword: (pwd:string)=>boolean,
    hasAdminRole: ()=> boolean,
    setAdmin: (value:boolean)=>void,
    hasModeratorRole: ()=> boolean,
    setModerator: (value:boolean)=>void,
    follow: (followed:string, res, next)=>void,
    unfollow: (followed:string, res, next)=>void,
    sendFriendRequest: (receiver:string, res, next)=>void,
    acceptFriendRequest: (requester:string, res, next)=>void,
    refuseFriendRequest: (refused: string, res, next)=>void,
    removeFriend: (user: string, res, next)=>void,
    updatePoints: (loserEmail)=>void
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
    }

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

userSchema.methods.follow = function (followed: string, res, next) {
    let user = this
    return getModel().findOne({email: followed}).lean().then(data => {
        let isF = isFollowable(user, data, "follow");
        if (!isF[0])
            throw new Error(isF[1]);

        user.following.push(followed);

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
        data.save().then(() => next({statusCode: 200, error: false, message: "Update successful"}));
    }).catch(err => {
        next({statusCode: 400, error: true, errormessage: err.message});
    });
}

userSchema.methods.acceptFriendRequest = function (requester: string, res, next) {
    let user = this;
    if (user.friendRequests.includes(requester)) {
        getModel().findOne({email: requester}).then(data => {
            data.friends.push(user.email);
            let idx = user.friendRequests.indexOf(requester)
            user.friendRequests.splice(idx, 1);
            user.friends.push(requester);

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


