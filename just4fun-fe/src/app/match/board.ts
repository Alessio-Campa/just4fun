const ROWS: number = 6;
const COLUMNS: number = 7;
const colors: string[] = ["#ff4c4c ", "#ffff4c"];

export class Board {
  constructor(_$board: any, board: number[][]) {
    this.$board = $(_$board);
    console.log(this.$board)
    for(let i = 0; i < COLUMNS; ++i) {
      let column = [];
      board.forEach(c => column.unshift( c[i] ));

      this.columns[i] = new Column(this, column);
      this.$board.append(this.columns[i].$element);
    }
  }

  changeTurn()
  {
      this._turn = (this._turn + 1) % 2;
  }
  get turn()
  {
    return this._turn;
  }

  private $board: JQuery;
  private _turn = 0;
  private columns: Column[] = [];
}

export class Column {
  constructor(private parent: Board, col: number[]) {
    let that = this;
    this.$element = $('<div/>');
    this.$element.css("float", "left");
    this.$cells = [];
    for (let j = 0; j < ROWS; j++) {
      this.$cells[j] = $("#cellTemplate .cell").clone(true, true);
      this.$element.append(this.$cells[j]);
      if (col[j] !== null){
        that.$cells[j].find('.cellDisk').css('backgroundColor', colors[col[j]]);
        that.occupied++;
      }
    }

    this.$element.on('mouseenter', function () {
      that.isMouseInside = true;
      if (that.occupied === ROWS)
        that.$element.find('.cellDisk').css('boxShadow',  "0px 0px 10px 4px red inset");
      else
        that.$element.find('.cellDisk').css('boxShadow',  "0px 0px 10px 4px lime inset");
    });

    this.$element.on('mouseleave', function () {
      that.isMouseInside = false;
      that.$element.find('.cellDisk').css('boxShadow',  "");
    });

    this.$element.on('click', function () {
      if(that.occupied < ROWS) {
        let currentOccupied = that.occupied;
        let currentColor = colors[parent.turn];
        that.occupied++;
        parent.changeTurn();
        for (let j = 0; j < ROWS - currentOccupied; j++) {
          setTimeout(() => {
            if (j > 0)
              that.$cells[j - 1].find('.cellDisk').css('backgroundColor', "");

            that.$cells[j].find('.cellDisk').css('backgroundColor', currentColor);

            if (j == ROWS - currentOccupied - 1 && that.isMouseInside)
              that.$element.trigger('mouseenter');
          }, j * 50)
        }
      }
    });
  }

  $element: JQuery;
  $cells: JQuery[];
  isMouseInside = false;
  occupied = 0;
}
