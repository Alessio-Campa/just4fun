import mongoose = require("mongoose")
import * as user from "./User"
import { match } from "assert";
import { getIoServer } from '../bin/socket'
import {stringify} from "querystring";
let AsyncLock = require('async-lock');
let lock = new AsyncLock();

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
	let interval;
	let thisMatchmaking = this;
	let startSearch = Date.now();
	let ios = getIoServer();

	let matchmakeDone = function (opponentPlayer, thisPlayer) {
		thisPlayer.remove();
		opponentPlayer.remove();
		clearInterval(interval);
		let message = {
			subject: "matchMakingFound",
			player0: thisPlayer.playerID,
			player1: opponentPlayer.playerID
		}
		ios.to(thisPlayer.playerID).emit("broadcast", message)
		ios.to(opponentPlayer.playerID).emit("bradcast", message)
		console.log((thisPlayer.playerID + " " + opponentPlayer.playerID).bgWhite.black);
	}

	let matchmakeFail = function (thisPlayer) {
		thisPlayer.min -= RANGE_EXPANSION/2.0;
		thisPlayer.max += RANGE_EXPANSION/2.0;
		thisPlayer.save()
	}

	user.getModel().findOne({email: this.playerID}, {points: 1}).then((thisPlayer)=>{
		interval = setInterval(()=>{
			lock.acquire('matchmaking', function (lockRelease) {
				matchmakingModel.findOne({ _id: thisMatchmaking._id }).select("_id").lean().then(isNotMatched => {
					if (!isNotMatched) {
						console.log((thisMatchmaking.playerID + " Already matched").bgWhite.black);
						clearInterval(interval);
						lockRelease();
					}
					else {
						console.log(`${thisMatchmaking.playerID} ${thisMatchmaking.min} ${thisMatchmaking.max}; searching...`.cyan)
						matchmakingModel.findOne({
							playerID: {$ne: thisMatchmaking.playerID},
							min: {$lte: thisPlayer.points},
							max: {$gte: thisPlayer.points},
						}).sort({
							timestamp: "ascending"
						}).then((data) => {
							if (data) {
								//Matches oldest in queue that respect filter
								matchmakeDone(data, thisMatchmaking);
								lockRelease();
							} else {
								if (Date.now() - startSearch > INTERSECTION_TIME_LIMIT) {//Too much wait, take nearest
									matchmakingModel.findOne({
										playerID: {$ne: thisMatchmaking.playerID},
									}).sort([
										[{$abs: {$subtract: [thisPlayer.points, "$min"]}}, 1]
									]).then((data) => {
										if (data)
											//Match nearest
											matchmakeDone(data, thisMatchmaking);
										else
											//No one is in the matchMaking
											matchmakeFail(thisMatchmaking);

										lockRelease();
									});
								} else {
									//Update range and wait
									matchmakeFail(thisMatchmaking);
									lockRelease();
								}
							}
						});
					}
				});
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
