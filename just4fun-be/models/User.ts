import * as mongoose from 'mongoose'
import * as crypto from 'crypto'

export interface User extends mongoose.Document{
    username: string,
    mail: string,
    points: number,
    friends: string[],
    roles: string[],
    salt: string,
    digest: string,

    setPassword: (pwd:string)=>void,
    validatePassword: (pwd:string)=>boolean,
    hasAdminRole: ()=> boolean,
    setAdmin: (value:boolean)=>void,
    hasModeratorRole: ()=> boolean,
    setModerator: (value:boolean)=>void
}

let userSchema = new mongoose.Schema<User>({
    username: {
        type: mongoose.SchemaTypes.String,
        required: true
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
    roles: {
        type: [mongoose.SchemaTypes.String],
        required: true
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


export function getSchema() { return userSchema; }

let userModel: mongoose.Model <User> = mongoose.model('User', getSchema());
export function getModel(): mongoose.Model <User> {
    return userModel;
}

export function newUser (data): User{
    let userModel = getModel();
    return new userModel(data);
}


