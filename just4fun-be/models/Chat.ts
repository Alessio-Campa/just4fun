import mongoose = require("mongoose");

export interface Chat extends mongoose.Document{
    matchID: string,
    members: string[],
    messages: {
        sender: string,
        text: string,
        timestamp: number
    }[]
}

export function isChat(arg: any): arg is Chat{
    return arg &&
        arg.members && Array.isArray(arg.members) &&
        arg.messages && Array.isArray(arg.messages);
}

let chatSchema = new mongoose.Schema<Chat>({
    matchID: {
        type: mongoose.SchemaTypes.String,
        required: false,
        default: null
    },
    members: {
        type: [mongoose.SchemaTypes.String],
        required: true
    },
    messages: [{
        sender: {
            type: mongoose.SchemaTypes.String,
            required: true
        },
        text:  {
            type: mongoose.SchemaTypes.String,
            required: true
        },
        timestamp: {
            type: mongoose.SchemaTypes.Number,
            required: true,
            default: Date.now()
        }
    }]
})
export function getSchema() {return chatSchema}

let chatModel;
export function getModel(): mongoose.Model< Chat > {
    if (!chatModel)
        chatModel = mongoose.model('Chat', getSchema())
    return chatModel
}

export function newChat (matchID: string, members: string[]): Chat{
    let test = getModel();
    return new test({matchID: matchID, members: members, messages: []});
}
