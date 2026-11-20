// get html elements
const start = document.getElementById("StartButton");
const buttonBox = document.getElementById("ButtonBox");
const text = document.getElementById("MainText");
const board = document.getElementById("Board");
const keyboard = document.getElementById("KeyboardBox");

// get game variables
let numLetters = parseInt(document.getElementById("LetterCount").textContent, 10);
let x = 0;
let y = 0;
let gameStart = false;
let answers = [];
let valid = new Set();
let hiddenWord = "words"; // will be replaced
// game constants
const tiles = [];
const NUM_GUESSES = 6;

// Clean up text for valid answers / guesses lists
function trimTextFile(text) {
    return text
    .split('\n') // split the text file by newline
    .map(w => w.trim().toLowerCase()) // trim and make words lowercase
    .filter(w => w.length > 0); // remove any blank lines that made their way in
}

// Fetch answers and guesses from txt files
async function fetchWords() {
    let text = await fetch('answers.txt').then(r => r.text());
    // trim all the answers and put them into the array
    answers = trimTextFile(text);
}
fetchWords();

async function fetchValidGuesses() {
    let text = await fetch('valid.txt').then(r => r.text());
    let guesses = trimTextFile(text);
    valid = new Set([...answers, ...guesses]);  
}
fetchValidGuesses();

// used to change screen state
function toggleHidden() {
    buttonBox.classList.toggle("Hide");
    keyboard.classList.toggle("Hide");
}

// clears the keyboard back to nuetral color
function clearKeyboard() {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    for (const letter of alphabet) {
        let key = document.getElementById(letter);
        key.classList.remove("Green", "Yellow", "Red");
        key.style.color = "#000000";
    }
}

// Start game button
start.addEventListener("click", function() {
    text.textContent = "Infinidle";

    // Get hidden word
    hiddenWord = answers[Math.floor(Math.random()*answers.length)];

    // Reset board
    board.replaceChildren();
    x = 0;
    y = 0;
    // Create tiles
    for (let a = 0; a < NUM_GUESSES; a++) {
        const row = document.createElement('div');
        row.className = 'BoardCenter';
        tiles[a] = [];
        for (let b = 0; b < numLetters; b++)
        {
            let tile = document.createElement('div');
            tile.className = 'Tile';
            row.appendChild(tile);
            tiles[a][b] = tile;
        }
        board.appendChild(row);
    }
    // Hide button
    gameStart = true;
    clearKeyboard();
    toggleHidden();
    start.textContent = "Play again?";
});

function check(guess) {
    let letterCount = 0;
    // Turn the tiles into a string
    const remainingLetters = {};
    // Check green letters
    for (let i = 0; i < numLetters; i++) {
        if (guess[i] === hiddenWord[i]) {
            tiles[y][i].classList.add("Green");
            document.getElementById(guess[i]).classList.add("Green");
            letterCount++;
        } else {
            // Mark letters that are in the word but not guessed correctly
            if (remainingLetters[hiddenWord[i]] === undefined) {
                remainingLetters[hiddenWord[i]] = 0;
            }
            remainingLetters[hiddenWord[i]]++;
        }
    }
    // Check yellow/red letters
    for (let i = 0; i < numLetters; i++) {
        let currKey = document.getElementById(guess[i]);
        // For any letters in the word but guessed in the wrong spot, mark yellow 
        if(guess[i] != hiddenWord[i] && remainingLetters[guess[i]] > 0) {
            tiles[y][i].classList.add("Yellow");;
            if (!currKey.classList.contains("Green")) {
                currKey.classList.add("Yellow");; 
            }
            remainingLetters[guess[i]]--;
        }
        // Mark wrong letters red
        else if (guess[i] != hiddenWord[i]) {
            tiles[y][i].classList.add("Red");
            if (!currKey.classList.contains("Green") && !currKey.classList.contains("Yellow")) {
                currKey.classList.add("Red");
            }
        }
    }
    return letterCount === numLetters;
}

// Keypress functions (enter, backspace, char)
function pressChar(letter) {
    if (!gameStart || x >= numLetters) {
        return;
    }
    tiles[y][x].textContent = letter.toLowerCase();
    x++;
}

function pressBackspace() {
    if (!gameStart || x === 0) {
        return;
    }
    x--;
    tiles[y][x].textContent = '';
}

function pressEnter() {
   if (!gameStart) {
        return;
    }
    if (x < numLetters) {
        // TODO Do error animation
        return;
    }
    const guess = tiles[y].map(t => t.textContent).join('');
    if(!valid.has(guess)) {
        const popup = document.getElementById("NaW");
        popup.showPopover();
        setTimeout(() => popup.hidePopover(), 2000);
        // TODO: Shake animation
        return;
    }
    let victory = check(guess);
    if (victory) {
        // Get display text ready
        y++;
        let guess = "guesses!";
        if(y == 1) {
            guess = "guess!";
        }
        gameStart = false;
        hiddenWord = hiddenWord[0].toUpperCase() + hiddenWord.slice(1);
        // Create HTML element and prepend
        const prevRes = document.getElementById('result');
        if(prevRes) {
            prevRes.remove();
        }
        const result = document.createElement('p');
        result.id = 'result';
        result.className = 'MainText';        
        result.innerHTML = "You win! You found the word <b>" + hiddenWord + "</b> in " + y + " " + guess;
        buttonBox.prepend(result);
        toggleHidden();
        return;
    } 
    // Give feedback
    y++; 
    x = 0;
    if (y >= NUM_GUESSES) {
        // Create HTML element and prepend
        hiddenWord = hiddenWord[0].toUpperCase() + hiddenWord.slice(1);
        const prevRes = document.getElementById('result');
        if(prevRes) {
            prevRes.remove();
        }
        const result = document.createElement('p');
        result.id = 'result';
        result.className = 'MainText';        
        result.innerHTML = "Oh no! The hidden word was <b>" + hiddenWord + "</b>.";
        buttonBox.prepend(result);
        toggleHidden();
    }
}


// For desktop keyboards to call custom keypress functions
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        pressEnter();
    } else if (e.key === 'Backspace') {
        pressBackspace();
    } else {
        const char = e.key.toLowerCase();
        const isLetter = char.length === 1 && char >= 'a' && char <= 'z';
        if (isLetter) {
            pressChar(char);
        }
    }
});

// Event listeners for on site keyboard
function createKeyEvents() {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    for (const letter of alphabet) {
        let key = document.getElementById(letter);
        key.addEventListener("click", function() {
            pressChar(letter);
        });
    }
    let enter = document.getElementById("Enter");
    enter.addEventListener("click", function() {
            pressEnter();
    });
    let back = document.getElementById("Back");
    back.addEventListener("click", function() {
            pressBackspace();
    });
}
// call above function
createKeyEvents();