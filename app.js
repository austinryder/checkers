var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var turnDisplay = document.getElementById("turn");
var message = document.getElementById("message");
var resetButton = document.getElementById("reset");

var colors = {
    lightSquare: "#E6BF83",
    darkSquare: "#825B1F",
    blackChecker: {
        primary: "#191919",
        highlight: "#4c4c4c",
        highlight2: "#7f7f7f"
    },
    redChecker: {
        primary: "#ff1919",
        highlight: "#ff3232",
        highlight2: "#ff7f7f"
    }
}

var turn;
var boardWidth = 8;
var boardHeight = 8;

var squareWidth = 50;
var squareHeight = 50;

var selectedPiece = {r: -1, c: -1}

var checkerRadius = (squareWidth / 2) - 5;
var continueSquare = null;
var legalMoves;

var board;

canvas.addEventListener("mousedown", mouseDownHandler);
canvas.addEventListener("mouseup", mouseUpHandler);
canvas.addEventListener("mousemove", mouseMoveHandler);
resetButton.addEventListener("click", reset);

reset();

function reset() {
    turn = "red";
    turnDisplay.textContent = turn;
    turnDisplay.style.color = turn;
    message.textContent = " to move";
    
    board = [];

    for (var r=0; r<boardWidth; r++) {
        board[r] = [];
        for (var c=0; c<boardHeight; c++) {
            var color; 
            var piece = null;
            
            if ((c + r) % 2 == 0) {
                color = colors.lightSquare;
            } else {
                if (r < 3) {
                    piece = {
                        x: 0,
                        y: 0,
                        color: "black",
                        colorValues: colors.blackChecker,
                        queen: false,
                        selected: false
                    }
                } else if (r >= boardHeight - 3) {
                    piece = {
                        x: 0,
                        y: 0,
                        color: "red",
                        colorValues: colors.redChecker,
                        queen: false,
                        selected: false
                    }
                }
    
                color = colors.darkSquare;
            }
    
            board[r][c] = { color: color, piece: piece, r: r, c: c};
        }
    }

    drawBoard();
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var drawTop;
    
    //draw board
    for (var r=0; r<boardWidth; r++) {
        for (var c=0; c<boardHeight; c++) {
            var square = board[r][c];
            var squareX = c*squareWidth;
            var squareY = r*squareHeight;

            ctx.beginPath();
            ctx.rect(squareX, squareY, squareWidth, squareHeight);
            ctx.fillStyle = square.color;
            ctx.fill();
            ctx.closePath();           
        }
    }

    //draw pieces
    for (var r=0; r<boardWidth; r++) {
        for (var c=0; c<boardHeight; c++) {
            var square = board[r][c];
            var squareX = c*squareWidth;
            var squareY = r*squareHeight;

            if (square.piece !== null && square.piece !== undefined) {

                if (!(selectedPiece.r == r && selectedPiece.c == c)) {
                    square.piece.x = squareX + (squareWidth/2);
                    square.piece.y = squareY + (squareHeight/2);

                    drawChecker(square.piece);
                } else {
                    drawTop = square.piece;
                }
            }            
        }
    }

    //draw last, selected checker
    if (drawTop !== undefined) {
        drawChecker(drawTop);
        requestAnimationFrame(drawBoard);
    }
}

function drawChecker(piece) {
    ctx.beginPath();
    ctx.arc(piece.x, piece.y, checkerRadius, 0, Math.PI*2);
    ctx.fillStyle = piece.colorValues.primary;
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(piece.x, piece.y, checkerRadius - 2, 1.75 * Math.PI, 0.75 * Math.PI);
    ctx.strokeStyle = piece.colorValues.highlight;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(piece.x, piece.y, checkerRadius - 2, 0.75 * Math.PI, 1.75 * Math.PI);
    ctx.strokeStyle = piece.colorValues.highlight2;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.closePath();

    if (piece.queen) {
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = piece.colorValues.highlight2;
        ctx.fillText("♛", piece.x, piece.y + 6);
    }
}

function mouseDownHandler(e) {
    var relativeX = e.clientX - canvas.offsetLeft;
    var relativeY = e.clientY - canvas.offsetTop;

    if (relativeX > 0 && relativeX < canvas.width && relativeY > 0 && relativeY < canvas.height) {
        var c = Math.floor(relativeX / squareWidth);
        var r = Math.floor(relativeY / squareHeight);

        var piece = board[r][c].piece;
        if (piece === null) return;

        selectedPiece.r = r;
        selectedPiece.c = c;

        var dir = piece.color === "red" ? -1 : 1;

        if (continueSquare == null || continueSquare.r == selectedPiece.r && continueSquare.c == selectedPiece.c) {
            legalMoves = [];
            legalMoves.push(...getLegalMoves(piece, r, c, dir));
            if (piece.queen) {
                legalMoves.push(...getLegalMoves(piece, r, c, -dir));
            }
    
            //only allow capture on continue
            if (continueSquare != null) {
                legalMoves = legalMoves.filter(move => move.captures);
            }
        }
    }
}

function mouseUpHandler(e) {
    if (selectedPiece.r === -1 || selectedPiece.c === -1) return;

    var piece = board[selectedPiece.r][selectedPiece.c].piece;

    if (piece != null && piece.color == turn) {

        var relativeX = e.clientX - canvas.offsetLeft;
        var relativeY = e.clientY - canvas.offsetTop;

        if (relativeX > 0 && relativeX < canvas.width && relativeY > 0 && relativeY < canvas.height) {

            var c = Math.floor(relativeX / squareWidth);
            var r = Math.floor(relativeY / squareHeight);

            var move = legalMoves.find(move => move.r === r && move.c === c);

            if (move != undefined) {

                if (move.captures) {
                    board[move.captureSquare.r][move.captureSquare.c].piece = null;
                    legalSquares = null;

                    checkForWin();
                }

                //switch move only 
                if (!move.continues) {
                    turn = turn == "red" ? "black" : "red";
                    turnDisplay.textContent = turn;
                    turnDisplay.style.color = turn;
                    continueSquare = null;
                } else {
                    continueSquare = {r: move.r, c: move.c};
                }

                board[selectedPiece.r][selectedPiece.c].piece = null;

                if ((piece.color === "red" && r === 0) ||
                    (piece.color === "black" && r === boardHeight - 1)) {
                    piece.queen = true;
                }

                board[r][c].piece = piece;
            }
            
        }
    }

    selectedPiece.r = -1;
    selectedPiece.c = -1;
    requestAnimationFrame(drawBoard);
}

function getLegalMoves(piece, r, c, dir) {
    var legalMoves = [];

    var move = {r: r, c: c, captures: false, continues: false};
    var nextSquare;

    //check forward & left 2 deep
    nextSquare = getForwardAndLeftSquare(r, c, dir);
    if (nextSquare != null) {
        if (nextSquare.piece == null) {
            move = {r: nextSquare.r, c: nextSquare.c, captures: false, captureSquare: null, continues: false}
            legalMoves.push(move);
        } else if (nextSquare.piece.color != piece.color) {
            var capSquare = nextSquare;
            nextSquare = getForwardAndLeftSquare(r + dir, c - 1, dir);

            if (nextSquare != null) {
                if (nextSquare.piece == null) {
                    move = {r: nextSquare.r, c: nextSquare.c, captures: true, captureSquare: capSquare, continues: false};
                    var continuingMoves = getLegalMoves(piece, nextSquare.r, nextSquare.c, dir);
                    if (piece.queen && continuingMoves !== undefined)
                        continuingMoves.push(...getLegalMoves(piece, nextSquare.r, nextSquare.c, -dir));

                    if (continuingMoves !== undefined && continuingMoves.some(move => move.captures)) {
                        move.continues = true;
                    }

                    legalMoves.push(move);
                }
            }
        }
    }

    //check forward & right 2 deep
    nextSquare = getForwardAndRightSquare(r, c, dir);
    if (nextSquare != null) {
        if (nextSquare.piece == null) {
            move = {r: nextSquare.r, c: nextSquare.c, captures: false, captureSquare: null, continues: false}
            legalMoves.push(move);
        } else if (nextSquare.piece.color != piece.color) {
            var capSquare = nextSquare;
            nextSquare = getForwardAndRightSquare(r + dir, c + 1, dir);
            
            if (nextSquare != null) {
                if (nextSquare.piece == null) {
                    move = {r: nextSquare.r, c: nextSquare.c, captures: true, captureSquare: capSquare, continues: false}
                    var continuingMoves = getLegalMoves(piece, nextSquare.r, nextSquare.c, dir);
                    if (piece.queen && continuingMoves !== undefined)
                        continuingMoves.push(...getLegalMoves(piece, nextSquare.r, nextSquare.c, -dir));

                    if (continuingMoves !== undefined && continuingMoves.some(move => move.captures)) {
                        move.continues = true;
                    }

                    legalMoves.push(move);
                }
            }
        }
    }
    
    return legalMoves;
}

function getForwardAndLeftSquare(r, c, dir) {
    if (r + dir >= 0 && r + dir < boardHeight) {
        if (c - 1 >= 0) {
            return board[r + dir][c - 1];
        }
    } else {
        return null;
    }
}

function getForwardAndRightSquare(r, c, dir) {
    if (r + dir >= 0 && r + dir < boardHeight) {
        if (c + 1 < boardWidth) {
            return board[r + dir][c + 1];
        }
    } else {
        return null;
    }
}

function mouseMoveHandler(e) {
    var relativeX = e.clientX - canvas.offsetLeft;
    var relativeY = e.clientY - canvas.offsetTop;

    if (relativeX > 0 && relativeX < canvas.width && relativeY > 0 && relativeY < canvas.height &&
        selectedPiece.r >= 0 && selectedPiece.r < boardHeight && selectedPiece.c >= 0 && selectedPiece.c < boardWidth) {
        var piece = board[selectedPiece.r][selectedPiece.c].piece;

        if (piece != null) {
            piece.x = relativeX;
            piece.y = relativeY;
    
            requestAnimationFrame(drawBoard);
        }
    }
}

function checkForWin() {
    var blackHasPieces = false;
    var redHasPieces = false;
    var winner = "";

    for (var r=0; r<boardWidth; r++) {
        for (var c=0; c<boardHeight; c++) {
            if (board[r][c].piece !== null) {
                if (board[r][c].piece.color == "red") redHasPieces = true;
                if (board[r][c].piece.color == "black") blackHasPieces = true;
            }
        }
    }

    if (!redHasPieces) {
        winner = "black";
    } else if (!blackHasPieces) {
        winner = "red";
    }

    if (winner !== "") {
        turnDisplay.textContent = winner;
        message.textContent = " wins";
    }
}

//TODO - CHECKERS AI