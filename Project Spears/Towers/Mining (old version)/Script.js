let Money = 1;
let gold = 0;
let position = 1;
let currentlySelectedMan = 0;
let currentlySelectedMine = 0;

const moneyDivElement = document.getElementById('moneydiv');
const positionelement = document.getElementById('position');
const goldelement = document.getElementById('goldcount');
const manelelement = document.getElementById('Man1')

moneyDivElement.innerHTML = Money;
positionelement.innerHTML = position;
goldelement.innerHTML = gold;

function Clickmoney() {
    Money++;
    moneyDivElement.innerHTML = Money;
}

function Clickgold() {
    gold++;
    goldelement.innerHTML = gold;
}

function changepos() {
    if (position === 1) {
        position = 2;
        manelelement.style.left = '15%';
        manelelement.style.bottom = '-55%';

    } else if (position === 2) {
        position = 1;
        manelelement.style.left = '50%';
        manelelement.style.bottom = '15%';
    }
    positionelement.innerHTML = position;
    
}

function moveslave() {
    if (currentlySelectedMan !== 0 && currentlySelectedMine !== 0) {
        const manToMove = document.getElementById("Man" + currentlySelectedMan);
        let mineToReset = document.getElementById("minebox" + currentlySelectedMine);
    if (currentlySelectedMine === "sellbox") {
        manToMove.style.left = '50%';
        manToMove.style.top = '-15%';
        position = 0;
        mineToReset = document.getElementById("sellbox"); // <--- This is the fix
        } else if (currentlySelectedMine === 1) {
            manToMove.style.left = '15%';
            manToMove.style.top = '55%';
            position = 1;
        } else if (currentlySelectedMine === 2) {
            manToMove.style.left = '47%';
            manToMove.style.top = '55%';
            position = 2;
        } else if (currentlySelectedMine === 3) {
            manToMove.style.left = '79%';
            manToMove.style.top = '55%';
            position = 3;
        }
        const restetmine2 = mineToReset;
        manToMove.style.backgroundColor = "gray";
        restetmine2.style.backgroundColor = "coral";
        currentlySelectedMan = 0;
        currentlySelectedMine = 0;
    }
}

function selectman(manId) {
    currentlySelectedMan = manId;
    let Mansname = "Man" + manId;
    console.log (Mansname + " selected / clicked on");
    const mantochange = document.getElementById(Mansname);
    mantochange.style.backgroundColor = "blue";
    moveslave();
}

function selectmine(mineId) {
    if (currentlySelectedMine !== 0) {
        let previousMineId = "minebox" + currentlySelectedMine;
        if (currentlySelectedMine === 'sellbox') {
            previousMineId = 'sellbox';
        }
        const previousMineElement = document.getElementById(previousMineId);
        if (previousMineElement) {
             previousMineElement.style.backgroundColor = "coral";
        }
    }

    currentlySelectedMine = mineId;

    let newMineId = "minebox" + mineId;
    if (mineId === 'sellbox') {
        newMineId = 'sellbox';
    }
    const newMineElement = document.getElementById(newMineId);
    if (newMineElement) {
        newMineElement.style.backgroundColor = "blue";
    }

    moveslave();
}


function gameloop() {
    if (position === 0) {
        if (gold > 0) {
            gold--;
            Money++;
            goldelement.innerHTML = gold;
            moneyDivElement.innerHTML = Money;
        }
    } else if (position === 1 || position === 2 || position === 3) {
        gold = gold + position;
        goldelement.innerHTML = gold;
    }
}

function startgame() {
    setInterval(gameloop, 1000);
}

manelelement.style.left = '50%';
manelelement.style.bottom = '15%';

setInterval(varlistings, 20);

function varlistings() {
    // Construct the string using the global variables
    let varlist = `
        Selected Man: ${currentlySelectedMan}<br>
        Selected Mine: ${currentlySelectedMine}<br>
        Position: ${position}<br>
        Money: ${Money}<br>
        Gold: ${gold}
    `;
    
    const varlistingElement = document.getElementById('variables');

    // It's good practice to check if the element exists before using it
    if (varlistingElement) {
        varlistingElement.innerHTML = varlist;
    }
}

// slave at box1 //
// manelelement.style.left = '15%'
// manelelement.style.top = '55%'


// slave at box2 //
// manelelement.style.left = '47%'
// manelelement.style.top = '55%'

// slave at box3 //
// manelelement.style.left = '79%'
// manelelement.style.top = '55%'
