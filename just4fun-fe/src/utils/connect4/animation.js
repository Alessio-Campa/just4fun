const board = document.getElementById("board")
let turn = 0
const colors = ["#ff4c4c ", "#ffff4c"]
let occupied = [0,0,0,0,0,0,0]

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
    return 1
}

function drop(e){
    if (e.className === "cell"){
        e.childNodes[1].style.backgroundColor = "red"
        console.log("red")
        sleep(1000);
        //e.childNodes[1].style.boxShadow = "white"
        //console.log("white")
    }
}

for (let i = 0; i < 7; i++) {
    let column = document.createElement('div')
    column.numeroColonna = i
    column.className = "col"
    column.style = "float: left"

    column.onmouseenter = function (){
        column.childNodes.forEach( e => {
            if (e.className === "cell"){
                if (occupied[this.numeroColonna] === 6)
                    e.childNodes[1].style.boxShadow = "0px 0px 10px 4px red inset"
                else
                    e.childNodes[1].style.boxShadow = "0px 0px 10px 4px lime inset"
            }
        })
    }

    column.onmouseleave = function (){
        column.childNodes.forEach( e => {
            if (e.className === "cell"){
                e.childNodes[1].style.boxShadow = ""
            }
        })
    }

    column.onclick = function (){
        if(occupied[this.numeroColonna] === 6)
            return
        const child = column.children;
        for (let j = 0; j < child.length-occupied[this.numeroColonna]; j++) {
            setTimeout( () => {
                if (j > 0)
                    child[j-1].children[0].style.backgroundColor = "#333333"
                child[j].children[0].style.backgroundColor = colors[turn]
            }, j * 50)
        }
        turn = (turn + 1) % 2;
        occupied[this.numeroColonna]++;
    }

    board.appendChild(column)
    for (let j = 0; j < 6; j++) {
        var temp = document.getElementsByTagName("template")[0];
        var clon = temp.content.cloneNode(true);
        column.appendChild(clon);
    }
}

