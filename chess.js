class ChessAsset {
    constructor(src) {
        this.src = src
        this.image = new Image()
        this.image.src = src
        this.loaded = false
        this.image.addEventListener('load', () => {
            this.loaded = true
        })
    }

    drawImage(ctx, x, y, width, height) {
        if(this.loaded) {
            ctx.drawImage(this.image, x || 0, y || 0, width || this.image.width, height || this.image.height)
        }
    }
}

let basicChessAssets = {
    white: {
        king: new ChessAsset("assets/chessPieces/white/king.png"),
        queen: new ChessAsset("assets/chessPieces/white/queen.png"),
        rook: new ChessAsset("assets/chessPieces/white/rook.png"),
        bishop: new ChessAsset("assets/chessPieces/white/bishop.png"),
        knight: new ChessAsset("assets/chessPieces/white/knight.png"),
        pawn: new ChessAsset("assets/chessPieces/white/pawn.png")
    },
    black: {
        king: new ChessAsset("assets/chessPieces/black/king.png"),
        queen: new ChessAsset("assets/chessPieces/black/queen.png"),
        rook: new ChessAsset("assets/chessPieces/black/rook.png"),
        bishop: new ChessAsset("assets/chessPieces/black/bishop.png"),
        knight: new ChessAsset("assets/chessPieces/black/knight.png"),
        pawn: new ChessAsset("assets/chessPieces/black/pawn.png")
    }
}

class ChessPiece {
    constructor(x, y, color, chessboard) {
        this.x = x
        this.y = y
        let renderLocation = chessboard.getCellRect(x, y)
        this.renderX = renderLocation.x
        this.renderY = renderLocation.y
        this.color = color
        this.chessboard = chessboard
    }
    getPossibleMoves() {
        throw new Error("Not implemented")
    }
    render() {
        throw new Error("Not implemented")
    }
    get isWhite() {
        return this.color == "white"
    }
    get isBlack() { 
        return this.color == "black"
    }
    compulseMove(x, y) {
        this.x = x
        this.y = y
        let renderLocation = this.chessboard.getCellRect(x, y)
        this.renderX = renderLocation.x
        this.renderY = renderLocation.y
    }
    isChessPiece(chessPiece) {
        return this.x == chessPiece.x && this.y == chessPiece.y
    }
}

const mouseData = {
    x: 0,
    y: 0,
}
window.addEventListener("mousemove", (event) => {
    mouseData.x = event.x
    mouseData.y = event.y
})

class Chessboard {
    constructor(canvasElement, config) {
        this.canvasElement = canvasElement
        this.renderingContext = this.canvasElement.getContext("2d")
        this.config = {
            width: 600,
            cellColor1: "#DEDCCF",
            cellColor2: "#379B65",
            chessPieceColor1: "#EEEED2",
            chessPieceColor2: "#51504D",
            possibleMoveFillColor: "rgba(0, 0, 0, 0.1)",
            possibleMoveStrokeColor: "transparent",
            possibleMoveLineWidth: 2,
            ...config
        }
        this.turn = "white"
        this.client = "both"
        this.preRender = function() {}
        this.postRender = function() {}
        this.sharpness = 5
        let mapAndChessPieces = getBasicChessPieces(this)
        this.map = mapAndChessPieces.map
        this.chessPieces = mapAndChessPieces.chessPieces
        this.currentlyHoldingChessPiece = null
        this.currentlyLifting = false

        this.canvasElement.addEventListener("mousedown", (event) => {
            let cell = this.getCellByPoint(this.mouseX, this.mouseY)
            let chessPiece = this.map[cell.y][cell.x]
            let cellSize = this.cellSize
            if(chessPiece) {
                if(chessPiece.color != this.turn || clientCanOperateColor(chessPiece.color)) {
                    this.currentlyHoldingChessPiece = null
                    return
                }
                this.currentlyLifting = true
                this.currentlyHoldingChessPiece = chessPiece
                this.currentlyHoldingChessPiece.renderX = this.mouseX - cellSize / 2
                this.currentlyHoldingChessPiece.renderY = this.mouseY - cellSize / 2    
            } else {
                this.currentlyHoldingChessPiece = null
            }
        })
        this.canvasElement.addEventListener("mousemove", (event) => {
            let cellSize = this.cellSize
            if(this.currentlyHoldingChessPiece && this.currentlyLifting) {
                this.currentlyHoldingChessPiece.renderX = this.mouseX - cellSize / 2
                this.currentlyHoldingChessPiece.renderY = this.mouseY - cellSize / 2
            }
        })
        this.canvasElement.addEventListener("mouseup", (event) => {
            let cellSize = this.cellSize

            this.currentlyLifting = false
            if(this.currentlyHoldingChessPiece) {
                let cell = this.getCellByPoint(this.mouseX, this.mouseY)
                let possibleMoves = this.currentlyHoldingChessPiece.getPossibleMoves(this)
                let cellInPossibleMoves = false
                for(let i = 0; i != possibleMoves.length; i++) {
                    if(possibleMoves[i].x == cell.x && possibleMoves[i].y == cell.y) {
                        cellInPossibleMoves = true
                    }
                }
                if(cellInPossibleMoves) {
                    for(let i = 0; i != this.chessPieces.length; i++) {
                        if(this.chessPieces[i].x == cell.x && this.chessPieces[i].y == cell.y) {
                            this.chessPieces.splice(i, 1)
                            break
                        }
                    }
                    this.moveCell(
                        this.currentlyHoldingChessPiece.x,
                        this.currentlyHoldingChessPiece.y,
                        cell.x,
                        cell.y
                    )
                    this.currentlyHoldingChessPiece.compulseMove(cell.x, cell.y)
                    this.currentlyHoldingChessPiece = null
                    this.turn = oppositeColor(this.turn)
                } else {
                    this.currentlyHoldingChessPiece.renderX = this.currentlyHoldingChessPiece.x * cellSize
                    this.currentlyHoldingChessPiece.renderY = this.currentlyHoldingChessPiece.y * cellSize
                }
            }
            
        })
    }
    draw() {
        let cellSize = this.cellSize

        for(let x = 0; x != 8; x++) {
            for(let y = 0; y != 8; y++) {
                let color = (x + y) % 2 == 0
                    ? this.config.cellColor1
                    : this.config.cellColor2
                this.renderingContext.fillStyle = color
                this.renderingContext.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
            }
        }

        if(this.currentlyHoldingChessPiece) {
            let possibleMoves = this.currentlyHoldingChessPiece.getPossibleMoves()
            
            for(let i = 0; i != this.chessPieces.length; i++) {
                if(!this.chessPieces[i].isChessPiece(this.currentlyHoldingChessPiece)) {
                    this.chessPieces[i].render(cellSize, cellSize)
                }
            }
            for(let i = 0; i != possibleMoves.length; i++) {
                let move = possibleMoves[i]
                let center = this.getCellCenter(move.x, move.y)
                if(!move.kill) {
                    // Circle
                    this.renderingContext.fillStyle = this.config.possibleMoveFillColor
                    this.renderingContext.strokeStyle = this.config.possibleMoveStrokeColor
                    this.renderingContext.lineWidth = this.config.possibleMoveLineWidth
                    this.renderingContext.beginPath()
                    this.renderingContext.arc(center.x, center.y, cellSize / 6, 0, 2 * Math.PI)
                    this.renderingContext.fill()
                    this.renderingContext.stroke()
                    this.renderingContext.closePath()
                } else {
                    // Ring
                    this.renderingContext.strokeStyle = this.config.possibleMoveFillColor
                    this.renderingContext.lineWidth = 8
                    this.renderingContext.fillStyle = "transparent"
                    this.renderingContext.beginPath()
                    this.renderingContext.arc(center.x, center.y, cellSize / 2 - 4, 0, 2 * Math.PI)
                    this.renderingContext.stroke()
                    this.renderingContext.closePath()
                }
            }
            this.currentlyHoldingChessPiece.render(cellSize, cellSize)
        } else {
            for(let i = 0; i != this.chessPieces.length; i++) {
                this.chessPieces[i].render(cellSize, cellSize)
            }
        }
    }
    get cellSize() {
        return this.config.width / 8
    }
    getCellRect(x, y) {
        let cellSize = this.cellSize
        return {
            x: x * cellSize,
            y: y * cellSize,
            width: cellSize,
            height: cellSize,
            top: y * cellSize,
            left: x * cellSize,
            right: (x + 1) * cellSize,
            bottom: (y + 1) * cellSize
        }
    }
    getCellByPoint(x, y) {
        let cellSize = this.cellSize
        let xCell = Math.floor(x / cellSize)
        let yCell = Math.floor(y / cellSize)
        return {
            x: xCell,
            y: yCell
        }
    }
    startRendering() {
        this.canvasElement.style.width = this.config.width + "px"
        this.canvasElement.style.height = this.config.width + "px"
        this.canvasElement.width = this.config.width * this.sharpness
        this.canvasElement.height = this.config.width * this.sharpness
        this.renderingContext.scale(this.sharpness, this.sharpness)
        this.preRender()
        this.draw()
        this.postRender()
        requestAnimationFrame(this.startRendering.bind(this))
    }
    getCellCenter(x, y) {
        let cellSize = this.cellSize
        return {
            x: x * cellSize + cellSize / 2,
            y: y * cellSize + cellSize / 2
        }
    }
    getTrueColor(color) {
        return color == "white"
            ? this.config.chessPieceColor1
            : this.config.chessPieceColor2
    }
    get mouseX() {
        return mouseData.x - this.canvasElement.offsetLeft
    }
    get mouseY() {
        return mouseData.y - this.canvasElement.offsetTop
    }
    getRenderLocationByCell(x, y) {
        let cellSize = this.cellSize
        return {
            x: x * cellSize,
            y: y * cellSize,
            width: cellSize,
            height: cellSize
        }
    }
    exchangeMapCells(x1, y1, x2, y2) {
        let temp = this.map[y1][x1]
        this.map[y1][x1] = this.map[y2][x2]
        this.map[y2][x2] = temp
    }
    moveCell(x1, y1, x2, y2) {
        // move cell, leaving null in the old location
        this.map[y2][x2] = this.map[y1][x1]
        this.map[y1][x1] = null
    }
    getMapCell(x, y) {
        if(this.map[y] && this.map[y][x]) {
            return this.map[y][x]
        } else {
            return null
        }
    }
    isEmptyCell(x, y) {
        return this.map[y][x] == null
    }
}

class PawnChessPiece extends ChessPiece {
    constructor(x, y, color, chessboard) {
        super(x, y, color, chessboard)
    }
    render(width, height) {
        basicChessAssets[this.color].pawn.drawImage(
            this.chessboard.renderingContext,
            this.renderX,
            this.renderY,
            width,
            height
        )
    }
    getPossibleMoves() {
        let moves = []

        // Attacking
        let leftFrontCell = calculateMovement(this.x, this.y, "left forward", this.color)
        let leftFrontMapCell = chessboard.getMapCell(leftFrontCell.x, leftFrontCell.y)
        if(leftFrontMapCell) {
            if(leftFrontMapCell.color != this.color) {
                leftFrontCell.kill = true
                moves.push(leftFrontCell)
            }
        }
        let rightFrontCell = calculateMovement(this.x, this.y, "right forward", this.color)
        let rightFrontMapCell = chessboard.getMapCell(rightFrontCell.x, rightFrontCell.y)
        
        if(rightFrontMapCell) {
            if(rightFrontMapCell.color != this.color) {
                rightFrontCell.kill = true
                moves.push(rightFrontCell)
            }
        }

        // Moving forward
        let rightInFront = calculateMovement(this.x, this.y, "forward", this.color)
        if(chessboard.getMapCell(rightInFront.x, rightInFront.y) == null) {
            moves.push(rightInFront)
        } else {
            return moves
        }
        if(getChessboardY(this.y, this.color) != 1) {
            return moves
        }
        let twoInFront = calculateMovement(this.x, this.y, "forward forward", this.color)
        if(chessboard.getMapCell(twoInFront.x, twoInFront.y) == null) {
            moves.push(twoInFront)
        } else {
            return moves
        }
        return moves
    }
}
class KnightChessPiece extends ChessPiece {
    constructor(x, y, color, chessboard) {
        super(x, y, color, chessboard)
    }
    getPossibleMoves() {
        let moves = validatePossibleMoves([
            calculateMovement(this.x, this.y, "left left forward"),
            calculateMovement(this.x, this.y, "right right forward"),
            calculateMovement(this.x, this.y, "forward forward left"),
            calculateMovement(this.x, this.y, "forward forward right"),
            calculateMovement(this.x, this.y, "left left backward"),
            calculateMovement(this.x, this.y, "right right backward"),
            calculateMovement(this.x, this.y, "backward backward left"),
            calculateMovement(this.x, this.y, "backward backward right")
        ], this.color, this.chessboard)
        return moves
    }
    render() {
        basicChessAssets[this.color].knight.drawImage(
            this.chessboard.renderingContext,
            this.renderX,
            this.renderY,
            this.chessboard.cellSize,
            this.chessboard.cellSize
        )
    }
}

function calculateMovement(x, y, operations, color) {
    let parsedOperations = operations.split(" ")
    let modifier = color == "black" ? 1 : -1
    for(let i = 0; i != parsedOperations.length; i++) {
        let operation = parsedOperations[i]
        switch(operation) {
            case "forward":
                y += modifier
                break
            case "left":
                x -= modifier
                break
            case "right":
                x += modifier
                break
            case "backward":
                y -= modifier
                break
            
        }
    }
    return {
        x,
        y
    }
}

function getBasicChessPieces(chessboard) {
    let map = []
    let chessPieces = []
    for(let i = 0; i != 8; i++) {
        map[i] = new Array(8).fill(null, 0, 7)
        if(i == 1) {
            for(let j = 0; j != 8; j++) {
                let chessPiece = new PawnChessPiece(j, i, "black", chessboard)
                map[i][j] = chessPiece
                chessPieces.push(chessPiece)
            }
        }
        if(i == 0) {
            let firstKnight = new KnightChessPiece(1, i, "black", chessboard)
            let secondKnight = new KnightChessPiece(6, i, "black", chessboard)
            map[i] = [
                null,
                firstKnight,
                null,
                null,
                null,
                null,
                secondKnight,
                null
            ]
            chessPieces.push(firstKnight, secondKnight)
        }
        if(i == 6) {
            for(let j = 0; j != 8; j++) {
                let chessPiece = new PawnChessPiece(j, i, "white", chessboard)
                map[i][j] = chessPiece
                chessPieces.push(chessPiece)
            }
        }
        if(i == 7) {
            let firstKnight = new KnightChessPiece(1, i, "white", chessboard)
            let secondKnight = new KnightChessPiece(6, i, "white", chessboard)
            map[i] = [
                null,
                firstKnight,
                null,
                null,
                null,
                null,
                secondKnight,
                null
            ]
            chessPieces.push(firstKnight, secondKnight)
        }
    }
    return {
        map,
        chessPieces
    }
}

function oppositeColor(color) {
    return color == "white" ? "black" : "white"
}

function getChessboardY(y, color) {
    return color == "black" ? y : 7 - y
}

function clientCanOperateColor(client, color) {
    if(client == "both") {
        return true
    }
    if(client == "none") {
        return false
    }
    return client == color
}

function validatePossibleMoves(possibleMoves, color, chessboard) {
    let validMoves = []
    for(let i = 0; i < possibleMoves.length; i++) {
        let move = possibleMoves[i]
        let cell = chessboard.getMapCell(move.x, move.y)
        if(cell == null) {
            validMoves.push(move)
        } else {
            if(cell.color == oppositeColor(color)) {
                move.kill = true
                validMoves.push(move)
            }
    
        }
    }
    return validMoves
}