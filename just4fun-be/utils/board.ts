export enum PlayerEnum { Player1, Player2 }

const ROWS: number = 6;
const COLUMNS: number = 7;
const CELL_TO_WIN: number = 4;

export class Board{
    private readonly cells: PlayerEnum[][];
    private _turn: PlayerEnum;

    constructor() {
        this._turn = PlayerEnum.Player1;
        this.cells = [];
        for (let r = 0; r < ROWS; ++r) {
            this.cells[r] = [];
            for (let c = 0; c < COLUMNS; ++c) {
                this.cells[r][c] = null;
            }
        }
    }

    get turn(): PlayerEnum { return this._turn; }

    /**
     * @returns null if out of bounds or empty, player otherwise
     */
    getCell(row: number, column: number): PlayerEnum {
        if (row < 0 || row >= ROWS || column < 0 || column >= COLUMNS) {
            return null
        }
        return this.cells[row][column];
    }

    /**
     * @param column: the column in which you wanna insert your disk
     * @return row: the row in which the disk has been insert
     * @throws error: the column is not valid or the column is full
     */
    private insertDisk(column: number):number {
        if (column < 0 || column >= COLUMNS) throw new Error("Not a valid column");
        let row = 0;
        while (this.getCell(row, column) != null) {
            if (++row == ROWS) {
                throw new Error("The column is full");
            }
        }
        this.cells[row][column] = this._turn;
        return row;
    }

    /**
     * @param player: the player who's playing
     * @param column: the column in which you wanna insert player's disk
     * @returns Result: a Result instance if this is the winning move, null otherwise
     */
    makeMove(player: PlayerEnum, column: number):Result {
        if (player != this._turn) throw new Error("Not your turn"); //Not your turn

        let row;
        try{
            row = this.insertDisk(column);
        } catch (e) {
            return e
        }
        let winner: Result = this.checkWin(row, column);

        this._turn = (this._turn == PlayerEnum.Player1) ? PlayerEnum.Player2 : PlayerEnum.Player1; //switch turn
        return winner;
    }

    private checkWin(row:number, column:number): Result {
        /**
         * @param row: row of the current move
         * @param column: column of the current move
         * @returns Result: a Result instance if this is the winning move, null otherwise
         */
        let result: Result;

        result = this.checkDirection(row, column, -1,1)
        if (result == null)
            result = this.checkDirection(row, column, 0,1)
        if (result == null)
            result = this.checkDirection(row, column, 1, 1)
        if (result == null)
            result = this.checkDirection(row, column, 1, 0)

        console.log(result)
        return result;
    }

    /**
     * @param row: starter position's row from which start the winning test
     * @param column: starter position's column from which start the winning test
     * @param deltaRow:
     * @param deltaColumn:
     * @returns potentialWinner: an instance of Result, used as an output parameter
     */
    private checkDirection(row: number, column: number, deltaRow: number, deltaColumn: number): Result {
        const player: PlayerEnum = this.getCell(row, column)
        const potentialWinner: Result = new Result(this._turn);
        let count: number = CELL_TO_WIN - 1;
        let r: number = row, c: number = column;

        potentialWinner.add(r, c);
        while (this.getCell(r+=deltaRow, c+=deltaColumn) == player && count > 0) {
            count--;
            potentialWinner.add(r, c);
        }
        r = row; c = column;
        while (this.getCell(r-=deltaRow, c-=deltaColumn) == player && count > 0) {
            count--;
            potentialWinner.add(r, c);
        }

        if (count == 0)
            return potentialWinner;
        return null
    }

    testing(){
        for(let i = 0; i < 6; i++){
            let out = "";
            for(let j = 0; j < 7; j++){
                out += this.cells[i][j] == null ? "n" : this.cells[i][j]
                out += " "
            }
            console.log(out)
        }
    }
}

export class Result {
    private _cells: [number, number][] = null;
    readonly winner: PlayerEnum = null;

    constructor(winner: PlayerEnum) {
        this.winner = winner;
        this._cells = [];
    }

    add(r: number, c: number) { this._cells.push([r, c]); }
    clear(){ this._cells = []; }
    get cells(): [number, number][] { return [...this._cells]; }
}


function testing(){
    let b = new Board();
    b.makeMove(0, 1)
    b.makeMove(1,2)
    b.makeMove(0, 1)
    b.makeMove(1,2)
    b.makeMove(0, 1)
    b.makeMove(1,2)
    b.makeMove(0, 1)
    b.makeMove(1,2)
    b.testing()
}

//testing()