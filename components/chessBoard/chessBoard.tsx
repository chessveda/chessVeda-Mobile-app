// import React, { useState, useEffect } from 'react';
// import { View, StyleSheet, Dimensions, TouchableOpacity, Image, Text } from 'react-native';
// import { Chess, Square } from 'chess.js'; // We'll still use chess.js for game logic
// import { SvgUri } from 'react-native-svg';

// const { width } = Dimensions.get('window');
// const BOARD_SIZE = Math.floor(width) - 32; // Subtract some padding
// const SQUARE_SIZE = BOARD_SIZE / 8;

// interface ChessBoardProps {
//   fen?: string;
//   onMove?: (move: { from: string, to: string, promotion?: string }) => void;
//   orientation?: 'white' | 'black';
//   customPieces?: Record<string, any>;
// }

// const CustomChessBoard: React.FC<ChessBoardProps> = ({
//   fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
//   onMove,
//   orientation = 'white',
//   customPieces,
// }) => {
//   const [game, setGame] = useState<Chess>(new Chess(fen));
//   const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
//   const [validMoves, setValidMoves] = useState<Square[]>([]);
//   const [boardState, setBoardState] = useState<any[][]>([]);
  
//   // Files and ranks for the board coordinates
//   const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
//   const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
//   // Reverse files and ranks if orientation is black
//   const displayFiles = orientation === 'black' ? [...files].reverse() : files;
//   const displayRanks = orientation === 'black' ? [...ranks].reverse() : ranks;
  
//   // Setup the board
//   useEffect(() => {
//     try {
//       const newGame = new Chess(fen);
//       setGame(newGame);
//       updateBoardState(newGame);
//     } catch (error) {
//       console.error('Invalid FEN:', error);
//     }
//   }, [fen]);
  
//   // Update the board representation
//   const updateBoardState = (chessGame: Chess) => {
//     const board = [];
//     for (let r = 0; r < 8; r++) {
//       const row = [];
//       for (let f = 0; f < 8; f++) {
//         const square = `${files[f]}${ranks[r]}` as Square;
//         const piece = chessGame.get(square);
//         row.push({ square, piece });
//       }
//       board.push(row);
//     }
//     setBoardState(board);
//   };
  
//   // Handle square selection
//   const handleSquarePress = (square: Square) => {
//     if (selectedSquare === null) {
//       // First selection - check if there's a piece and it's the current player's turn
//       const piece = game.get(square);
//       if (piece && (piece.color === 'w' && game.turn() === 'w' || 
//                    piece.color === 'b' && game.turn() === 'b')) {
//         setSelectedSquare(square);
        
//         // Calculate valid moves for this piece
//         const moves = game.moves({ square, verbose: true });
//         setValidMoves(moves.map(move => move.to));
//       }
//     } else {
//       // Second selection - try to make a move
//       if (square !== selectedSquare) {
//         if (validMoves.includes(square)) {
//           // Check if this is a pawn promotion
//           const piece = game.get(selectedSquare);
//           let promotion = undefined;
          
//           if (piece && piece.type === 'p') {
//             // Check if pawn is moving to the last rank
//             const targetRank = square.charAt(1);
//             if ((piece.color === 'w' && targetRank === '8') || 
//                 (piece.color === 'b' && targetRank === '1')) {
//               promotion = 'q'; // Default to queen for simplicity
//             }
//           }
          
//           // Try to make the move
//           try {
//             const moveObj = { from: selectedSquare, to: square, promotion };
//             const result = game.move(moveObj);
            
//             if (result) {
//               // Move was successful
//               updateBoardState(game);
              
//               // Call the onMove callback if provided
//               if (onMove) {
//                 onMove(moveObj);
//               }
//             }
//           } catch (error) {
//             console.error('Invalid move:', error);
//           }
//         }
        
//         // Clear selection state
//         setSelectedSquare(null);
//         setValidMoves([]);
//       } else {
//         // Clicked the same square again - deselect
//         setSelectedSquare(null);
//         setValidMoves([]);
//       }
//     }
//   };
  
//   // Get the piece image based on piece type
//   const getPieceImage = (piece: any) => {
//     if (!piece) return null;
    
//     const pieceKey = `${piece.color}${piece.type.toUpperCase()}`;

//     console.log(`Rendering piece: ${pieceKey}`);
    
//     if (customPieces && customPieces[pieceKey]) {
//         console.log(`Image source for ${pieceKey}:`, customPieces[pieceKey]);
//       return (
//         <SvgUri 
//           width={SQUARE_SIZE * 0.8} 
//           height={SQUARE_SIZE * 0.8} 
//           uri={Image.resolveAssetSource(customPieces[pieceKey]).uri}
//           // uri={customPieces[pieceKey]}
//         />
//       );
//     }
    
//     return null;
//   };

//   // Render a square on the board
//   const renderSquare = (square: Square, squareColor: string, piece: any) => {
//     const isSelected = square === selectedSquare;
//     const isValidMove = validMoves.includes(square);
    
//     return (
//       <TouchableOpacity
//         key={square}
//         style={[
//           styles.square,
//           { backgroundColor: squareColor },
//           isSelected && styles.selectedSquare,
//           isValidMove && styles.validMoveSquare,
//         ]}
//         onPress={() => handleSquarePress(square)}
//       >
//        {piece && getPieceImage(piece)}
//       </TouchableOpacity>
//     );
//   };
  
//   // Render the board
//   const renderBoard = () => {
//     const squares = [];
    
//     // Add file labels (a-h)
//     squares.push(
//       <View key="files" style={styles.fileLabels}>
//         {displayFiles.map(file => (
//           <Text key={file} style={styles.label}>{file}</Text>
//         ))}
//       </View>
//     );
    
//     // Render board with rank labels
//     for (let r = 0; r < 8; r++) {
//       const rowSquares = [];
      
//       // Add rank label (1-8)
//       rowSquares.push(
//         <Text key={`rank-${displayRanks[r]}`} style={styles.rankLabel}>
//           {displayRanks[r]}
//         </Text>
//       );
      
//       // Add squares in this rank
//       for (let f = 0; f < 8; f++) {
//         const squareColor = (r + f) % 2 === 0 ? '#EBECD0' : '#595959';
//         const squareIndex = orientation === 'black' 
//           ? (7 - r) * 8 + (7 - f) 
//           : r * 8 + f;
        
//         const row = Math.floor(squareIndex / 8);
//         const col = squareIndex % 8;
        
//         const square = `${files[col]}${ranks[row]}` as Square;
//         const piece = game.get(square);
        
//         rowSquares.push(renderSquare(square, squareColor, piece));
//       }
      
//       squares.push(
//         <View key={`rank-${r}`} style={styles.row}>
//           {rowSquares}
//         </View>
//       );
//     }
    
//     return squares;
//   };
  
//   return (
//     <View style={styles.container}>
//       {renderBoard()}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     width: BOARD_SIZE,
//     height: BOARD_SIZE + SQUARE_SIZE, // Add space for file labels
//     margin: 16,
//   },
//   row: {
//     flexDirection: 'row',
//     height: SQUARE_SIZE,
//   },
//   square: {
//     width: SQUARE_SIZE,
//     height: SQUARE_SIZE,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   selectedSquare: {
//     backgroundColor: 'rgba(255, 255, 0, 0.5)', // Highlight selected square
//   },
//   validMoveSquare: {
//     backgroundColor: 'rgba(0, 255, 0, 0.3)', // Highlight valid move squares
//   },
//   pieceImage: {
//     width: SQUARE_SIZE * 0.8,
//     height: SQUARE_SIZE * 0.8,
//   },
//   fileLabels: {
//     flexDirection: 'row',
//     marginLeft: SQUARE_SIZE, // Space for rank label
//   },
//   label: {
//     width: SQUARE_SIZE,
//     textAlign: 'center',
//     marginBottom: 4,
//   },
//   rankLabel: {
//     width: SQUARE_SIZE / 2,
//     textAlign: 'center',
//     lineHeight: SQUARE_SIZE,
//   },
// });

// export default CustomChessBoard;




import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, Image } from 'react-native';
import { Chess, Square } from 'chess.js';

const { width } = Dimensions.get('window');
const BOARD_SIZE = width; // Subtract padding
const SQUARE_SIZE = BOARD_SIZE / 8;

interface ChessBoardProps {
  fen?: string;
  onMove?: (move: { from: string; to: string; promotion?: string }) => void;
  orientation?: 'white' | 'black';
  customPieces?: Record<string, any>;
}

const CustomChessBoard: React.FC<ChessBoardProps> = ({
  fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  onMove,
  orientation = 'white',
  customPieces,
}) => {
  const [game, setGame] = useState<Chess>(new Chess(fen));
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [boardState, setBoardState] = useState<any[][]>([]);

  // Standard "files" and "ranks" in top-to-bottom order:
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  // Reverse them if orientation is black (for internal logic only):
  const displayFiles = orientation === 'black' ? [...files].reverse() : files;
  const displayRanks = orientation === 'black' ? [...ranks].reverse() : ranks;

  // Default PNG pieces if customPieces not provided
  const defaultPieces = {
    wP: require('../../assets/images/white-pawn.svg'),
    bP: require('../../assets/images/black-pawn.png'),
    // wN: require('../../assets/images/white-knight.png'),
    // wB: require('../../assets/images/bishop-white.png'),
    // wR: require('../../assets/images/rook-white.png'),
    // wQ: require('../../assets/images/queen-white.png'),
    // wK: require('../../assets/images/king-white.png'),
   
    // bN: require('../../assets/images/black-knight.png'),
    // bB: require('../../assets/images/black-bishop.png'),
    // bR: require('../../assets/images/black-rook.png'),
    // bQ: require('../../assets/images/black-queen.png'),
    // bK: require('../../assets/images/black-king.png'),
  };

  // Use custom pieces if provided, otherwise use default PNG pieces
  const pieces = customPieces || defaultPieces;

  useEffect(() => {
    try {
      const newGame = new Chess(fen);
      setGame(newGame);
      updateBoardState(newGame);
    } catch (error) {
      console.error('Invalid FEN:', error);
    }
  }, [fen]);

  const updateBoardState = (chessGame: Chess) => {
    const board = [];
    for (let r = 0; r < 8; r++) {
      const row = [];
      for (let f = 0; f < 8; f++) {
        const square = `${files[f]}${ranks[r]}` as Square;
        const piece = chessGame.get(square);
        row.push({ square, piece });
      }
      board.push(row);
    }
    setBoardState(board);
  };

  const handleSquarePress = (square: Square) => {
    if (selectedSquare === null) {
      // Select piece if it's the current turn's color
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setValidMoves(moves.map((move) => move.to));
      }
    } else {
      // Attempt to make a move
      if (square !== selectedSquare && validMoves.includes(square)) {
        const piece = game.get(selectedSquare);
        let promotion;

        // If it's a pawn promotion
        if (piece && piece.type === 'p') {
          const targetRank = square.charAt(1);
          if (
            (piece.color === 'w' && targetRank === '8') ||
            (piece.color === 'b' && targetRank === '1')
          ) {
            promotion = 'q';
          }
        }

        try {
          const moveObj = { from: selectedSquare, to: square, promotion };
          const result = game.move(moveObj);

          if (result) {
            updateBoardState(game);
            if (onMove) onMove(moveObj);
          }
        } catch (error) {
          console.error('Invalid move:', error);
        }
      }
      // Reset selection
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const getPieceImage = (piece: any) => {
    if (!piece) return null;

    const pieceKey = `${piece.color}${piece.type.toUpperCase()}`;
    const pieceSource = pieces[pieceKey];

    if (pieceSource) {
      return (
        <Image
          source={pieceSource}
          style={styles.pieceImage}
          resizeMode="contain"
        />
      );
    }

    return null;
  };

  // Render a single square (including piece, selection highlights, and labels)
  const renderSquare = (
    square: Square,
    squareColor: string,
    piece: any,
    rowIndex: number,
    colIndex: number
  ) => {
    const isSelected = square === selectedSquare;
    const isValidMove = validMoves.includes(square);

    // For displayed rank/file labels, use the original files/ranks arrays
    // This ensures labels are always positioned consistently regardless of orientation
    const actualFile = orientation === 'black' ? files[7 - colIndex] : files[colIndex];
    const actualRank = orientation === 'black' ? ranks[7 - rowIndex] : ranks[rowIndex];

    // Show labels only on the edges of the board
    const showRankLabel = orientation === 'white' ? colIndex === 0 : colIndex === 7;
    const showFileLabel = orientation === 'white' ? rowIndex === 7 : rowIndex === 0;

    return (
      <TouchableOpacity
        key={square}
        style={[
          styles.square,
          { backgroundColor: squareColor },
          isSelected && styles.selectedSquare,
          isValidMove && styles.validMoveSquare,
        ]}
        onPress={() => handleSquarePress(square)}
      >
        {/* Rank label - place it on the left for white, right for black */}
        {showRankLabel && (
          <Text
            style={[
              styles.rankLabel,
              orientation === 'black' ? styles.rankLabelBlack : styles.rankLabelWhite
            ]}
          >
            {actualRank}
          </Text>
        )}

        {/* File label - place it on the bottom for white, top for black */}
        {showFileLabel && (
          <Text
            style={[
              styles.fileLabel,
              orientation === 'black' ? styles.fileLabelBlack : styles.fileLabelWhite
            ]}
          >
            {actualFile}
          </Text>
        )}

        {/* Render piece if present */}
        {piece && getPieceImage(piece)}
      </TouchableOpacity>
    );
  };

  const renderBoard = () => {
    const rows = [];

    for (let r = 0; r < 8; r++) {
      const rowSquares = [];
      for (let f = 0; f < 8; f++) {
        // Determine color of square
        const squareColor = (r + f) % 2 === 0 ? '#EBECD0' : '#595959';

        // If orientation is black, we need to invert row/col to get the correct squares
        const displayRow = orientation === 'black' ? 7 - r : r;
        const displayCol = orientation === 'black' ? 7 - f : f;
        
        const squareName = `${files[displayCol]}${ranks[displayRow]}` as Square;
        const pieceOnSquare = game.get(squareName);

        rowSquares.push(
          renderSquare(squareName, squareColor, pieceOnSquare, r, f)
        );
      }
      rows.push(
        <View key={`row-${r}`} style={styles.row}>
          {rowSquares}
        </View>
      );
    }
    return rows;
  };

  return <View style={styles.container}>{renderBoard()}</View>;
};

const styles = StyleSheet.create({
  container: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
  },
  row: {
    flexDirection: 'row',
    height: SQUARE_SIZE,
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', // needed for absolutely positioned labels
  },
  selectedSquare: {
    backgroundColor: 'rgba(255, 255, 0, 0.5)',
  },
  validMoveSquare: {
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
  },
  pieceImage: {
    width: SQUARE_SIZE * 0.8,
    height: SQUARE_SIZE * 0.8,
  },
  // Base label styles
  rankLabel: {
    position: 'absolute',
    fontSize: 12,
    color: '#000',
  },
  fileLabel: {
    position: 'absolute',
    fontSize: 12,
    color: '#000',
  },
  // Position for white orientation
  rankLabelWhite: {
    top: 2,
    left: 2,
  },
  fileLabelWhite: {
    bottom: 2,
    right: 2,
  },
  // Position for black orientation
  rankLabelBlack: {
    top: 2,
    right: 2,
  },
  fileLabelBlack: {
    top: 2,
    left: 2,
  },
});

export default CustomChessBoard;




