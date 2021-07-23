import mongoose = require("mongoose")

export interface Message{
    sender: string,
    text: string,
    timestamp: Date
}

export function isMessage(arg: any): arg is Message {
    return arg &&
        arg.sender && typeof(arg.sender) == 'string' &&
        arg.text && typeof(arg.text) == 'string' &&
        arg.timestamp && arg.timestamp instanceof Date;
}

let messageSchema = new mongoose.Schema<Message>( {
    sender: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    text:  {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    timestamp: {
        type: mongoose.SchemaTypes.Date,
        required: true
    }
})
export function getSchema() { return messageSchema; }

let messageModel;  // This is not exposed outside the model
export function getModel() : mongoose.Model< mongoose.Document > { // Return Model as singleton
    if( !messageModel )
        messageModel = mongoose.model('Message', getSchema() )
    return messageModel;
}