const ROWS: number = 6;
const COLUMNS: number = 7;
const colors: string[] = ["#ff4c4c ", "#ffff4c"];

export class Board {
  constructor(_$board: any, board: number[][], callback = ()=>{}) {
    this.$board = $(_$board);
    for(let i = 0; i < COLUMNS; ++i) {
      let column = [];
      board.forEach(c => column.unshift( c[i] ));

      this.addColumn(column, i, callback);
    }
  }

  protected addColumn(column, i, callback){
    this.columns[i] = new Column(this, column);
    this.$board.append(this.columns[i].$element);
  }

  public $board: JQuery;
  protected _turn: number = 0;
  protected columns: Column[] = [];
}


export class PlayableBoard extends Board{
  constructor(_$board: any, board: number[][], turn: number, myTest) {
    super(_$board, board, myTest);
    this._turn = turn;
  }

  protected addColumn(column, i, callback){
    this.columns[i] = new PlayableColumn(this, column, callback, i);
    this.$board.append(this.columns[i].$element);
  }

  get turn() {
    return this._turn;
  }
  public changeTurn(){
    this._turn = (this.turn + 1)%2;
  }

}

export class Column {
  constructor(protected parent: Board, col: number[]) {
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


export class PlayableColumn extends Column{
  constructor(protected parent: PlayableBoard, col: number[], myTest, index) {
    super(parent, col);
    let that = this;
    for (let j = 0; j < ROWS; j++) {
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
        myTest(index); //TODO: da testare dopo aver fixato l'angular guardone
        let currentOccupied = that.occupied;
        let currentColor = colors[parent.turn];
        that.occupied++;
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
