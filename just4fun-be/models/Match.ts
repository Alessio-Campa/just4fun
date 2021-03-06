import * as mongoose from 'mongoose'
import {stringify} from "querystring";
import {getIoServer} from "../bin/socket";
import * as user from "./User";

const ROWS: number = 6;
const COLUMNS: number = 7;
const CELL_TO_WIN: number = 4;
const CELLS: number = ROWS * COLUMNS;

export interface Match extends mongoose.Document{
    player0: string,
    player1: string,
    winner: {
        player: number,
        positions: number[][]
    },
    turn: number,
    board: number[][],
    moves: number[],
    matchStart: Date,
    lastMove: Date,

    makeMove: (player: string, column: number) => void,
    insertDisk: (column: number) => number,
    getCell: (row: number, column: number) => number,
    checkWin: (row:number, column:number) => Result,
    checkDirection: (row:number, column:number, deltaRow:number, deltaColumn:number) => Result
}

export function isMatch(arg): arg is Match{
    return arg &&
        arg.player0 && typeof(arg.player0) == 'string' &&
        arg.player1 && typeof(arg.player1) == 'string' &&
        arg.turn !== null && typeof(arg.turn) == 'number' &&
        arg.board && Array.isArray(arg.board) &&
        arg.moves && Array.isArray(arg.moves) &&
        arg.matchStart && arg.matchStart instanceof Date &&
        arg.lastMove && arg.lastMove instanceof Date
}

let matchSchema = new mongoose.Schema<Match>({
    player0: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    player1: {
        type: mongoose.SchemaTypes.String,
        required: true
    },
    winner: {
        player: {
            type: mongoose.SchemaTypes.Number,
            required: false,
            default: null
        },
        positions: {
            type: [[mongoose.SchemaTypes.Number]],
            required: false,
            default: null
        }
    },
    turn:  {
        type: mongoose.SchemaTypes.Number,
        required: true,
        default: 0
    },
    board: {
        type: [[mongoose.SchemaTypes.Number]],
        required: true,
        default: Array(6).fill(Array(7).fill(null))
    },
    moves:  {
        type: [mongoose.SchemaTypes.Number],
        required: true,
        default: []
    },
    matchStart: {
        type: mongoose.SchemaTypes.Date,
        required: true,
        default: Date.now()
    },
    lastMove: {
        type: mongoose.SchemaTypes.Date,
        required: true,
        default: Date.now()
    }
})

matchSchema.methods.makeMove = function (player: string, column: number): void {
    let ios = getIoServer();
    if (this.winner.player !== null) throw new Error("Match ended");
    if ((this.turn == 0 && player != this.player0) || (this.turn == 1 && player != this.player1)) throw new Error("Not your turn");
    let row;
    try{
        row = this.insertDisk(column);
    } catch (e) {
        return e
    }
    this.moves.push(column)
    let winnerCheck = this.checkWin(row, column);
    let message = {
        subject: "newMove",
        matchID: this.id,
        column: column,
        player: player //TODO: in teoria non serve
    }
    ios.to(this.id + 'watchers').emit("newMove", message);
    ios.to(this.id + 'players').emit("newMove", message);
    if(winnerCheck.winner !== null){
        this.winner.player = winnerCheck.winner;
        this.winner.positions = winnerCheck.cells;
        this.markModified("winner")
        let message = {
            subject: "matchEnded",
            matchID: this.id,
            win: this.winner,
        }
        ios.to(this.id + 'watchers').emit("matchEnded", message);
        ios.to(this.id + 'players').emit("matchEnded", message);
        let winner;
        let loser;
        if (this.winner.player === 0) {
            winner = this.player0;
            loser = this.player1;
        } else {
            loser = this.player0;
            winner = this.player1;
        }

        user.getModel().findOne({email: winner}).then((theWinner) => {
            theWinner.updatePoints(loser);
        });
    }

    this.turn = (this.turn + 1) % 2 //switch turn
}

matchSchema.methods.insertDisk = function(column: number): number {
    if (column < 0 || column >= COLUMNS) throw new Error("Not a valid column");
    let row = 0;
    while (this.getCell(row, column) != null) {
        if (++row == ROWS) {
            throw new Error("The column is full");
        }
    }

    this.lastMove = new Date;
    this.board[row][column] = this.turn;
    this.markModified("board");
    return row;
}

matchSchema.methods.getCell = function(row: number, column: number): number {
    if (row < 0 || row >= ROWS || column < 0 || column >= COLUMNS) {
        return null
    }
    return this.board[row][column];
}

matchSchema.methods.checkWin = function(row:number, column:number): Result {
    let result;

    if (this.moves.length >= CELLS) {
        result = new Result();
        result.setWinner(-1); // draw
        return result
    }

    result = this.checkDirection(row, column, -1,1)
    if (result.winner == null)
        result = this.checkDirection(row, column, 0,1)
    if (result.winner == null)
        result = this.checkDirection(row, column, 1, 1)
    if (result.winner == null)
        result = this.checkDirection(row, column, 1, 0)

    return result;
}

matchSchema.methods.checkDirection = function(row:number, column:number, deltaRow:number, deltaColumn:number): Result {
    const player:number = this.getCell(row, column);
    const potentialWinner:Result = new Result();
    let count: number = CELL_TO_WIN - 1;
    let r:number = row, c:number = column;

    potentialWinner.add(r, c);
    while (this.getCell(r+=deltaRow, c+=deltaColumn) == player && count > 0){
        count--;
        potentialWinner.add(r, c);
    }
    r = row; c = column;
    while (this.getCell(r-=deltaRow, c-=deltaColumn) == player && count > 0){
        count--;
        potentialWinner.add(r, c);
    }

    if (count == 0)
        potentialWinner.setWinner(player);
    return potentialWinner;

}

export function getSchema() {return matchSchema}

let matchModel;
export function getModel(): mongoose.Model< mongoose.Document > {
    if (!matchModel)
        matchModel = mongoose.model('Match', getSchema());
    return matchModel
}

export function newMatch (player0: string, player1: string): Match{
    if(Math.random() < 0.5) //On 50% of case switch player
    {
        let temp = player0;
        player0 = player1;
        player1 = temp;
    }

    return new matchModel({"player0": player0, "player1": player1});
}

// utility classes
class Result {
    private _cells: [number, number][] = null;
    private _winner: number = null;

    constructor() {
        this._cells = [];
    }

    add(r: number, c: number) { this._cells.push([r, c]); }
    setWinner(w: number) {this._winner = w}
    clear(){ this._cells = []; }
    get winner() {return this._winner}
    get cells(): [number, number][] { return [...this._cells]; }
}