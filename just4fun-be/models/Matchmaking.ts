import mongoose = require("mongoose")

const RANGE_EXPANSION: number = 10;

export interface Matchmaking extends mongoose.Document {
	playerID: string,
	range: (number,number), 
	timestamp: Date, //TODO find the correct type

	searchMatch()=> void
}

export class MatchMakingMethods extends MatchMaking{

}

export function isMatchMaking(arg){
    return arg &&
        arg.playerID && typeof(arg.playerID) === 'string' &&
        arg.range && typeof(arg.range) === '(number,number)' &&
        arg.timestamp && typeof(arg.timestamp) === 'time'
}

let matchMakingSchema = new mongoose.Schema<MatchMaking>({
    playerID: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    range: {
	    type: mongoose.SchemaTypes. //TODO which type for a tuple?,
        required: true
    },
	timestamp: {
		type: mongoose.SchemaTypes.Date,
		required: true
    }
})

matchMakingSchema.methods.searchMatch = function (): void {
	//TODO: to implement
	throw new Error();
}

