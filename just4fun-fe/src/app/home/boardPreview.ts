const ROWS: number = 6;
const COLUMNS: number = 7;
const colors: string[] = ["#ff4c4c ", "#ffff4c"];

export class Board {
  constructor(_$board: any, board: number[][]) {
    this.$board = $(_$board);
    for(let i = 0; i < COLUMNS; ++i) {
      let column = [];
      board.forEach(c => column.unshift( c[i] ));

      this.columns[i] = new Column(this, column);
      this.$board.append(this.columns[i].$element);
    }
  }

  public $board: JQuery;
  private columns: Column[] = [];
}

export class Column {
  constructor(private parent: Board, col: number[]) {
    let that = this;
    this.$element = $('<div/>');
    this.$element.css("float", "left");
    this.$element.css('width', '14.28%')
    this.$element.addClass('board-column')
    this.$cells = [];
    for (let j = 0; j < ROWS; j++) {
      this.$cells[j] = $("#cellTemplate .cell").clone(true, true)
      this.$element.append(this.$cells[j]);

      if (col[j] !== null)
        that.$cells[j].find('.cellDisk').css('backgroundColor', colors[col[j]]);

    }

  }

  $element: JQuery;
  $cells: JQuery[];
}
