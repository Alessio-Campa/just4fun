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
		arg.min && typeof(arg.min) === 'number' &&
		arg.max && typeof(arg.max) === 'number' &&
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

matchMakingSchema.methods.searchMatch = function (): void { //TODO: testing, potrebbe essere molto buggata
	let matchmakeDone = function (interval, myId, opponentId)
	{
		matchmakingModel.remove({
			$or: [{playerID: opponentId},{playerID: myId}]
		});
		clearInterval(interval);
		// TODO: pinga user
	}

	let matchmakeFail = function (thisPlayer)
	{
		thisPlayer.min -= RANGE_EXPANSION/2.0;
		thisPlayer.max += RANGE_EXPANSION/2.0;
		matchmakingModel.updateOne({playerID: thisPlayer.playerID}, {min: thisPlayer.min, max: thisPlayer.max});
	}

	let startSearch = Date.now();
	user.getModel().findById(this.playerID, {points: 1}).then((thisPlayer)=>{
		let interval = setInterval(()=>{
			matchmakingModel.findOne({
				playerID: {$ne: this.playerID},
				min: {$lte: thisPlayer.points},
				max: {$gte: thisPlayer.points},
			}).sort({
				timestamp: "ascending"
			}).then((data) => {
				if (data){
					//Match oldest in queue that respect filter
					matchmakeDone(interval, this.playerID, data.playerID);
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
								matchmakeDone(interval, this.playerID, data.playerID);
							else
								//No one is in the matchMaking
								matchmakeFail(thisPlayer);
						});
					}
					else
					{
						//Update range and wait
						matchmakeFail(thisPlayer);
					}
				}
			});
		}, RANGE_EXPANSION_INTERVAL);
	});
}


export function getSchema() {
	return matchMakingSchema;
}

let matchmakingModel: mongoose.Model <Matchmaking> = mongoose.model('Matchmaking', getSchema());

export function getModel(): mongoose.Model <Matchmaking> {
	return matchmakingModel;
}

export function newMatchmaking (data): Matchmaking{
	let matchMakingModel = getModel();
	return new matchMakingModel(data);
}
