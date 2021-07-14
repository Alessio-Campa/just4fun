enum PlayerEnum { Player1, Player2 }

const ROW: number = 6;
const COLUMN: number = 6;
const CELL_TO_WIN: number = 4;

class Board {
    private cells: PlayerEnum[][];
    private _turn: PlayerEnum;

    constructor() {
        this._turn = PlayerEnum.Player1;
        this.cells = [];
        for (let r = 0; r < ROW; ++r) {
            this.cells[r] = [];
            for (let c = 0; c < COLUMN; ++c) {
                this.cells[r][c] = null;
            }
        }
    }

    get turn(): PlayerEnum { return this._turn; }
    private switchTurn() {
        this._turn = (this._turn == PlayerEnum.Player1) ? PlayerEnum.Player2 : PlayerEnum.Player1;
    }

    getCell(row: number, column: number): PlayerEnum {
        return this.cells[row][column];
    }

    private setCell(row: number, column: number, value: PlayerEnum) {
        this.cells[row][column] = value;
    }

    makeMove(player: PlayerEnum, column: number) {
        if (player != this.turn) return false; //Not your turn
        if (0 <= column && column < COLUMN) return false; //Not a valid column
        if (this.getCell(ROW - 1, column) != null) return false; //Column full

        //Insert disk
        let row = 0;
        while (this.getCell(row, column) != null) {
            ++row;
        }
        this.setCell(row, column, player);

        this.switchTurn();
        return true;
    }

    checkWin(): Result {
        let winner;
        for (let r = 0; r < ROW; ++r) {
            winner = this.checkWinRow(r);
            if (winner != null)
                return winner;
        }

        for (let c = 0; c < COLUMN; ++c) {
            winner = this.checkWinColumn(c);
            if (winner != null)
                return winner;
        }

        for (let r = 0; r < ROW; ++r) {
            winner = this.checkWinPrimaryDiagonal(r, 0);
            if (winner != null)
                return winner;
        }
        for (let c = 1; c < COLUMN; ++c) {
            winner = this.checkWinPrimaryDiagonal(0, c);
            if (winner != null)
                return winner;
        }

        for (let r = 0; r < ROW; ++r) {
            winner = this.checkWinSecondaryDiagonal(r, COLUMN - 1);
            if (winner != null)
                return winner;
        }
        for (let c = 0; c < COLUMN - 1; ++c) {
            winner = this.checkWinSecondaryDiagonal(0, c);
            if (winner != null)
                return winner;
        }

        return null;
    }

    private checkWinRow(r: number): Result {
        let winner;
        let checker = new WinnerChecker(this);
        for (let c = 0; c < COLUMN; ++c) {
            winner = checker.check(r, c);
            if (winner != null)
                return winner;
        }
        return null;
    }
    private checkWinColumn(c: number): Result {
        let winner;
        let checker = new WinnerChecker(this);
        for (let r = 0; r < ROW; ++r) {
            winner = checker.check(r, c);
            if (winner != null)
                return winner;
        }
        return null;
    }
    private checkWinPrimaryDiagonal(r: number, c: number): Result {
        let winner;
        let checker = new WinnerChecker(this);
        while (r < ROW && c < COLUMN) {
            winner = checker.check(r, c);
            if (winner != null)
                return winner;
            ++r;
            ++c;
        }
        return null;
    }
    private checkWinSecondaryDiagonal(r: number, c: number): Result {
        let winner;
        let checker = new WinnerChecker(this);
        while (r < ROW && c >= 0) {
            winner = checker.check(r, c);
            if (winner != null)
                return winner;
            ++r;
            --c;
        }
        return null;
    }
}

class WinnerChecker {
    readonly board: Board;
    private result: Result = new Result(null);

    constructor(board: Board) {
        this.board = board;
    }

    check(r: number, c: number): Result
    {
        let cell = this.board.getCell(r, c);
        if(cell != null)
        {
            if (this.result.winner == cell)
            {
                this.result.add(r, c);
                if (this.result.cells.length == CELL_TO_WIN)
                    return this.result;
            }
            else
            {
                this.result = new Result(cell);
                this.result.add(r, c);
            }
        }
        return null;
    }
}

class Result {
    private _cells: [number, number][] = null;
    readonly winner: PlayerEnum = null;

    constructor(winner: PlayerEnum) {
        this.winner = winner;
    }

    add(r: number, c: number) { this._cells.push([r, c]); }
    get cells(): [number, number][] { return [...this._cells]; }
}