import mongoose = require("mongoose")
import * as user from "./User"
import { match } from "assert";

const RANGE_EXPANSION: number = 20;
const RANGE_EXPANSION_INTERVAL: number = 2000; //2sec
const INTERSECTION_TIME_LIMIT: number = 16 * 1000; //16sec

export interface Matchmaking extends mongoose.Document{
	playerID: string,
	min: number,
	max: number,
	timestamp: Date,

	searchMatch: ()=> void
}

export function isMatchMaking(arg): arg is Matchmaking{
	return arg &&
		arg.playerID && typeof(arg.playerID) === 'string' &&
		arg.min != null && typeof(arg.min) === 'number' &&
		arg.max != null && typeof(arg.max) === 'number' &&
		arg.timestamp && arg.timestamp instanceof Date
}

let matchMakingSchema = new mongoose.Schema<Matchmaking>({
	playerID: {
		type: mongoose.SchemaTypes.String,
		required: true
	},
	min: {
		type: mongoose.SchemaTypes.Number,
		required: true
	},
	max: {
		type: mongoose.SchemaTypes.Number,
		required: true
	},
	timestamp: {
		type: mongoose.SchemaTypes.Date,
		required: true,
		default: Date.now()
	}
})

matchMakingSchema.methods.searchMatch = function (): void {
	let matchmakeDone = function (interval, opponentPlayer, thisPlayer) {
		thisPlayer.remove();
		opponentPlayer.remove()
		clearInterval(interval);
		// TODO: pinga user
		// console.log((thisPlayer.playerID + " " + opponentPlayer.playerID).bgWhite.black);
	}

	let matchmakeFail = function (thisPlayer) {
		thisPlayer.min -= RANGE_EXPANSION/2.0;
		thisPlayer.max += RANGE_EXPANSION/2.0;
		thisPlayer.save()
	}

	let startSearch = Date.now();
	user.getModel().findById(this.playerID, {points: 1}).then((thisPlayer)=>{
		let interval = setInterval(()=>{
			// console.log(`${this.playerID} ${this.min} ${this.max}; searching...`.cyan)
			matchmakingModel.findOne({
				playerID: {$ne: this.playerID},
				min: {$lte: thisPlayer.points},
				max: {$gte: thisPlayer.points},
			}).sort({
				timestamp: "ascending"
			}).then((data) => {
				if (data){
					//Matches oldest in queue that respect filter
					matchmakeDone(interval, data, this);
				}
				else{
					if(Date.now()-startSearch > INTERSECTION_TIME_LIMIT)
					{//Too much wait, take nearest
						matchmakingModel.findOne({
							playerID: {$ne: this.playerID},
						}).sort([
							[{ $abs: { $subtract: [ thisPlayer.points, "$min" ] }}, 1]
						]).then((data) => {
							if (data)
								//Match nearest
								matchmakeDone(interval, data, this);
							else
								//No one is in the matchMaking
								matchmakeFail(this);
						});
					}
					else {
						//Update range and wait
						matchmakeFail(this);
					}
				}
			});
		}, RANGE_EXPANSION_INTERVAL);
	});
}


export function getSchema() {
	return matchMakingSchema;
}

let matchmakingModel;

export function getModel(): mongoose.Model <Matchmaking> {
	if (!matchmakingModel)
		matchmakingModel = mongoose.model('Matchmaking', getSchema());
	return matchmakingModel;
}

export function newMatchmaking (data): Matchmaking{
	let matchMakingModel = getModel();
	return new matchMakingModel(data);
}
