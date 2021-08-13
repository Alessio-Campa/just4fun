const board = document.getElementById("board")
let turn = 0
const colors = ["#ff4c4c ", "#ffff4c"]
let falling = [false, false, false, false, false, false, false]

let cols = []

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
    return 1
}

for (let i = 0; i < 7; i++) {
    let column = document.createElement('div')
    column.numeroColonna = i
    column.className = "col"
    column.style = "float: left"

    column.drop = function (){
        const child = column.children;
        for (let j = 0; j < 7; j++) {
            setTimeout( () => {
                if (j > 0)
                    child[j-1].children[0].style.backgroundColor = "#333333"
                child[j].children[0].style.backgroundColor = colors[turn]
            }, j * 150)
        }
        turn = (turn + 1) % 2;
    }

    board.appendChild(column)
    for (let j = 0; j < 6; j++) {
        var temp = document.getElementsByTagName("template")[0];
        var clon = temp.content.cloneNode(true);
        column.appendChild(clon);
    }
    cols.push(column)
}



for(let i = 0; i < 200; i++){
    let c;
    setTimeout(()=>{
        //do {
            c = Math.floor(Math.random()*7);
        //} while (falling[c])
        falling[c] = true
        cols[c].drop()
    }, i*250)
    //setTimeout(()=>{falling[c] = false}, i*251);
}
