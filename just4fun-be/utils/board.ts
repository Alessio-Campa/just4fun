enum PlayerEnum { Player1, Player2 }

const ROWS: number = 6;
const COLUMNS: number = 7;
const CELL_TO_WIN: number = 4;

class Board {
    private cells: PlayerEnum[][];
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

    getCell(row: number, column: number): PlayerEnum {
        /**
         * @throws error: not a valid column
         */
        if (row < 0 || row >= ROWS || column < 0 || column >= COLUMNS) {
            throw new Error("Index out of bound");
        }
        return this.cells[row][column];
    }

    private insertDisk(column: number):number {
        /**
         * @param column: the column in which you wanna insert your disk
         * @return row: the row in which the disk has been insert
         * @throws error: the column is not valid or the column is full
         */
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

    makeMove(player: PlayerEnum, column: number):Result {
        /**
         * @param player: the player who's playing
         * @param column: the column in which you wanna insert player's disk
         * @returns Result: a Result instance if this is the winning move, null otherwise
         */
        if (player != this.turn) throw new Error("Not your turn"); //Not your turn
        let row = this.insertDisk(column);
        let winner: Result = this.checkWin(row, column);
        this._turn = (this._turn == PlayerEnum.Player1) ? PlayerEnum.Player2 : PlayerEnum.Player1; //switch turn
        return winner;
    }

    private checkWin(row:number, column:number):Result {
        /**
         * @param row: row of the current move
         * @param column: column of the current move
         * @returns Result: a Result instance if this is the winning move, null otherwise
         */
        let potentialWinner:Result = new Result(this._turn);
        if (this.checkDirection(row, column, -1,1, potentialWinner)) return potentialWinner;
        if (this.checkDirection(row, column, 0,1, potentialWinner)) return potentialWinner;
        if (this.checkDirection(row, column, 1, 1, potentialWinner)) return potentialWinner;
        if (this.checkDirection(row, column, 1, 0, potentialWinner)) return potentialWinner;
        return null;
    }

    private checkDirection(row:number, column:number, deltaRow:number, deltaColumn:number, potentialWinner:Result): boolean {
        /**
         * @param row: starter position's row from which start the winning test
         * @param column: starter position's column from which start the winning test
         * @param deltaRow:
         * @param deltaColumn:
         * @param potentialWinner: an instance of Result, used as an output parameter
         * @returns boolean: true if there is a winning combination, false otherwise
         */
        let counterWin = 0;
        let player = this.getCell(row, column);
        let testingRow = row, testingColumn = column;
        let newPosition = player;
        while (newPosition == player) {
            potentialWinner.add(testingRow, testingColumn);
            counterWin++;
            testingColumn += deltaColumn;
            testingRow += deltaRow;
            try {
                newPosition = this.getCell(testingRow, testingColumn);
            } catch (e) {
                potentialWinner.clear();
                break;
            }
            if (counterWin == CELL_TO_WIN) return true;
        }
        counterWin = 0;
        newPosition = player;
        testingColumn -= deltaColumn;
        testingRow -= deltaRow;
        while (newPosition == player) {
            potentialWinner.add(testingRow, testingColumn);
            counterWin++;
            testingColumn -= deltaColumn;
            testingRow -= deltaRow;
            try {
                newPosition = this.getCell(testingRow, testingColumn);
            } catch (e) {
                potentialWinner.clear();
                break;
            }
            if (counterWin == CELL_TO_WIN) return true;
        }
        return false;
    }
}

class Result {
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
