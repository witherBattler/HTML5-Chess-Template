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
    }
    canMoveTo(chessBoard) {
        throw new Error("Not implemented")
    }
    getPossibleMoves(chessBoard) {
        throw new Error("Not implemented")
    }
    render(chessBoard) {
        throw new Error("Not implemented")
    }
    get isWhite() {
        return this.color == "white"
    }
    get isBlack() { 
        return this.color == "black"
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
            cellColor1: "#EEEED2",
            cellColor2: "#769656",
            chessPieceColor1: "#EEEED2",
            chessPieceColor2: "#51504D",
            ...config
        }
        this.preRender = function() {}
        this.postRender = function() {}
        this.sharpness = 5
        let mapAndChessPieces = getBasicChessPieces(this)
        this.map = mapAndChessPieces.map
        this.chessPieces = mapAndChessPieces.chessPieces
        this.currentlyHoldingChessPiece = null
        
        this.canvasElement.addEventListener("mousedown", (event) => {
            let cell = this.getCellByPoint(event.clientX, event.clientY)
            let chessPiece = this.map[cell.y][cell.x]
            let cellSize = this.cellSize
            if(chessPiece) {
                this.currentlyHoldingChessPiece = chessPiece
                this.currentlyHoldingChessPiece.renderX = this.mouseX - cellSize / 2
                this.currentlyHoldingChessPiece.renderY = this.mouseY - cellSize / 2    
            } else {
                this.currentlyHoldingChessPiece = null
            }
        })
        this.canvasElement.addEventListener("mousemove", (event) => {
            let cellSize = this.cellSize
            if(this.currentlyHoldingChessPiece) {
                this.currentlyHoldingChessPiece.renderX = this.mouseX - cellSize / 2
                this.currentlyHoldingChessPiece.renderY = this.mouseY - cellSize / 2
            }
        })
        this.canvasElement.addEventListener("mouseup", (event) => {
            let chessPiece = this.currentlyHoldingChessPiece
            if(chessPiece) {
                let renderLocation = this.getRenderLocationByCell(chessPiece.x, chessPiece.y)
                chessPiece.renderX = renderLocation.x
                chessPiece.renderY = renderLocation.y
                this.currentlyHoldingChessPiece = null
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

        for(let i = 0; i != this.chessPieces.length; i++) {
            this.chessPieces[i].render(this, cellSize, cellSize)
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
}

class PawnChessPiece extends ChessPiece {
    constructor(x, y, color, chessboard) {
        super(x, y, color, chessboard)
    }
    canMoveTo(chessboard, x, y) {
        let firstPosition =
            calculateMovement(this.x, this.y, "forward")
        let firstPositionIsBlocked =
            chessboard.map[firstPosition.x][firstPosition.y] != null
        if(firstPosition.x == x && firstPosition.y == y && !firstPositionIsBlocked) {
            return true
        }
        let secondPosition =
            calculateMovement(this.x, this.y, "forward forward")
        let secondPositionIsBlocked =
            chessboard.map[secondPosition.x][secondPosition.y] != null
        if(secondPosition.x == x && secondPosition.y == y && !secondPositionIsBlocked) {
            return true
        }
        return false
    }
    render(chessboard, width, height) {
        basicChessAssets[this.color].pawn.drawImage(
            chessboard.renderingContext,
            this.renderX,
            this.renderY,
            width,
            height
        )
    }
    getPossibleMoves(chessboard) {
        let firstPosition =
            calculateMovement(this.x, this.y, "forward")
        let firstPositionIsBlocked =
            chessboard.map[firstPosition.x][firstPosition.y] != null
        if(!firstPositionIsBlocked) {
            return [firstPosition]
        }
        let secondPosition =
            calculateMovement(this.x, this.y, "forward forward")
        let secondPositionIsBlocked =
            chessboard.map[secondPosition.x][secondPosition.y] != null
        if(!secondPositionIsBlocked) {
            return [secondPosition]
        }
        return []
    }
}

function calculateMovement(x, y, opetions, color) {
    let parsedOperations = operations.split(" ")
    let modifier = color == "white" ? 1 : -1
    for(let i = 0; i != parsedOperations.length; i++) {
        let operation = parsedOperations[i]
        switch(operation) {
            case "up":
                y *= modifier
                break
            case "down":
                y *= -modifier
                break
            case "left":
                x *= -modifier
                break
            case "right":
                x *= modifier
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
        if(i == 6) {
            for(let j = 0; j != 8; j++) {
                let chessPiece = new PawnChessPiece(j, i, "white", chessboard)
                map[i][j] = chessPiece
                chessPieces.push(chessPiece)
            }
        }
    }
    return {
        map,
        chessPieces
    }
}