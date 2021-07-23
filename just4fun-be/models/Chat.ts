import mongoose = require("mongoose")
import {Message} from "./Message";

export interface Chat {
    idMatch: string,
    members: string[],
    messages: Message[]
}

export function isChat(arg){
    return arg &&
        arg.members && Array.isArray(arg.members) &&
        arg.messages && Array.isArray(arg.messages);
}

let chatSchema = new mongoose.Schema<Chat>({
    idMatch: {
        type: mongoose.SchemaTypes.String,
        required: false
    },
    members: {
        type: [mongoose.SchemaTypes.String],
        required: true
    },
    messages: [{
        sender: {
            type: mongoose.SchemaTypes.String,
            required: false
        },
        text:  {
            type: mongoose.SchemaTypes.String,
            required: false
        },
        timestamp: {
            type: mongoose.SchemaTypes.Date,
            required: false
        }
    }]
})
export function getSchema() {return chatSchema}

let chatModel;
export function getModel(): mongoose.Model< mongoose.Document > {
    if (!chatModel)
        chatModel = mongoose.model('Chat', getSchema())
    return chatModel
}