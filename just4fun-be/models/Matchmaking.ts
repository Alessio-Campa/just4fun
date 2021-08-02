import mongoose = require("mongoose")

const RANGE_EXPANSION: number = 10;

export interface MatchMaking{
	playerID: string,
	range: [number,number],
	timestamp: Date,

	searchMatch: ()=> void
}

export class MatchMakingMethods implements MatchMaking{
    playerID: string;
    range: [number, number];
    timestamp: Date;

    searchMatch(): void {
        //TODO: to implement
        throw new Error();
    }

}

export function isMatchMaking(arg): arg is MatchMaking{
    return arg &&
        arg.playerID && typeof(arg.playerID) === 'string' &&
        arg.range && typeof(arg.range) === 'object' &&
        arg.timestamp && typeof(arg.timestamp) === 'object'
}

let matchMakingSchema = new mongoose.Schema<MatchMaking>({
    playerID: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    range: {
	    type: mongoose.SchemaTypes.Array,
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

