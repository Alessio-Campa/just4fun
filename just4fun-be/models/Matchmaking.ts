import mongoose = require("mongoose")

const RANGE_EXPANSION: number = 10;

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
        arg.range && typeof(arg.range) === 'object' &&
        arg.timestamp && typeof(arg.timestamp) === 'object'
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
		required: true
    }
})

matchMakingSchema.methods.searchMatch = function (): void { //TODO: testing, potrebbe essere molto buggata
	let playerPoints;
	let startSearch = Date.now();
	user.getModel().findById(this.playerID, {points: 1}).then((data)=>{
		playerPoints = data;
	});

	let interval = setInterval(()=>{
		let waitingPlayers;
		let found = false;
		let opponent;
		matchmakingModel.find({playerID: {$ne: this.playerID}, $or: [ {min: {$gte: this.max}}, {max: {$lte: this.min}}]}).then((data)=>{
			waitingPlayers = data
			waitingPlayers.forEach((element) => {
				if (found) {
					return;
				}
				if (Date.now()-startSearch > INTERSECTION_TIME_LIMIT){
					// TODO: potremmo ritornare quello con il punteggio più vicino
					opponent = element.playerID;
					matchmakingModel.remove({$or: [{playerID: opponent}, {playerID: this.playerID}]});
					found = true;
				}
				else if (element.min <= this.max || element.max >= this.min){
					opponent = element.playerID;
					matchmakingModel.remove({$or: [{playerID: opponent}, {playerID: this.playerID}]});
					found = true;
				}
			});
			if (found) {
				clearInterval(interval);
				return opponent;
			}
			let searcher;
			getModel().findOne({playerID: this.playerID}).then( (data) => {
				searcher = data;
				if (searcher === null) {
					matchmakingModel.insertMany({
						playerID: this.playerID,
						min: playerPoints - RANGE_EXPANSION,
						max: playerPoints + RANGE_EXPANSION,
						timestamp: Date.now()
					});
				}
				let min = data.min;
				let max = data.max;
				matchmakingModel.updateMany({playerID: this.playerID}, {
					$set: {min: min - RANGE_EXPANSION, max: max + RANGE_EXPANSION}
				});
			});
			//TODO: eventuale stop del soket
		});
	}, RANGE_EXPANSION_MS);

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
