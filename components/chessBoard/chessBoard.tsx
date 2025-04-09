import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Image, Text } from 'react-native';
import { Chess, Square } from 'chess.js'; // We'll still use chess.js for game logic
import { SvgUri } from 'react-native-svg';

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.floor(width) - 32; // Subtract some padding
const SQUARE_SIZE = BOARD_SIZE / 8;

interface ChessBoardProps {
  fen?: string;
  onMove?: (move: { from: string, to: string, promotion?: string }) => void;
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
  
  // Files and ranks for the board coordinates
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  // Reverse files and ranks if orientation is black
  const displayFiles = orientation === 'black' ? [...files].reverse() : files;
  const displayRanks = orientation === 'black' ? [...ranks].reverse() : ranks;
  
  // Setup the board
  useEffect(() => {
    try {
      const newGame = new Chess(fen);
      setGame(newGame);
      updateBoardState(newGame);
    } catch (error) {
      console.error('Invalid FEN:', error);
    }
  }, [fen]);
  
  // Update the board representation
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
  
  // Handle square selection
  const handleSquarePress = (square: Square) => {
    if (selectedSquare === null) {
      // First selection - check if there's a piece and it's the current player's turn
      const piece = game.get(square);
      if (piece && (piece.color === 'w' && game.turn() === 'w' || 
                   piece.color === 'b' && game.turn() === 'b')) {
        setSelectedSquare(square);
        
        // Calculate valid moves for this piece
        const moves = game.moves({ square, verbose: true });
        setValidMoves(moves.map(move => move.to));
      }
    } else {
      // Second selection - try to make a move
      if (square !== selectedSquare) {
        if (validMoves.includes(square)) {
          // Check if this is a pawn promotion
          const piece = game.get(selectedSquare);
          let promotion = undefined;
          
          if (piece && piece.type === 'p') {
            // Check if pawn is moving to the last rank
            const targetRank = square.charAt(1);
            if ((piece.color === 'w' && targetRank === '8') || 
                (piece.color === 'b' && targetRank === '1')) {
              promotion = 'q'; // Default to queen for simplicity
            }
          }
          
          // Try to make the move
          try {
            const moveObj = { from: selectedSquare, to: square, promotion };
            const result = game.move(moveObj);
            
            if (result) {
              // Move was successful
              updateBoardState(game);
              
              // Call the onMove callback if provided
              if (onMove) {
                onMove(moveObj);
              }
            }
          } catch (error) {
            console.error('Invalid move:', error);
          }
        }
        
        // Clear selection state
        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        // Clicked the same square again - deselect
        setSelectedSquare(null);
        setValidMoves([]);
      }
    }
  };
  
  // Get the piece image based on piece type
  const getPieceImage = (piece: any) => {
    if (!piece) return null;
    
    const pieceKey = `${piece.color}${piece.type.toUpperCase()}`;

    console.log(`Rendering piece: ${pieceKey}`);
    
    if (customPieces && customPieces[pieceKey]) {
        console.log(`Image source for ${pieceKey}:`, customPieces[pieceKey]);
      return (
        <SvgUri 
          width={SQUARE_SIZE * 0.8} 
          height={SQUARE_SIZE * 0.8} 
          uri={Image.resolveAssetSource(customPieces[pieceKey]).uri}
          // uri={customPieces[pieceKey]}
        />
      );
    }
    
    return null;
  };

  // Render a square on the board
  const renderSquare = (square: Square, squareColor: string, piece: any) => {
    const isSelected = square === selectedSquare;
    const isValidMove = validMoves.includes(square);
    
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
       {piece && getPieceImage(piece)}
      </TouchableOpacity>
    );
  };
  
  // Render the board
  const renderBoard = () => {
    const squares = [];
    
    // Add file labels (a-h)
    squares.push(
      <View key="files" style={styles.fileLabels}>
        {displayFiles.map(file => (
          <Text key={file} style={styles.label}>{file}</Text>
        ))}
      </View>
    );
    
    // Render board with rank labels
    for (let r = 0; r < 8; r++) {
      const rowSquares = [];
      
      // Add rank label (1-8)
      rowSquares.push(
        <Text key={`rank-${displayRanks[r]}`} style={styles.rankLabel}>
          {displayRanks[r]}
        </Text>
      );
      
      // Add squares in this rank
      for (let f = 0; f < 8; f++) {
        const squareColor = (r + f) % 2 === 0 ? '#EBECD0' : '#595959';
        const squareIndex = orientation === 'black' 
          ? (7 - r) * 8 + (7 - f) 
          : r * 8 + f;
        
        const row = Math.floor(squareIndex / 8);
        const col = squareIndex % 8;
        
        const square = `${files[col]}${ranks[row]}` as Square;
        const piece = game.get(square);
        
        rowSquares.push(renderSquare(square, squareColor, piece));
      }
      
      squares.push(
        <View key={`rank-${r}`} style={styles.row}>
          {rowSquares}
        </View>
      );
    }
    
    return squares;
  };
  
  return (
    <View style={styles.container}>
      {renderBoard()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: BOARD_SIZE,
    height: BOARD_SIZE + SQUARE_SIZE, // Add space for file labels
    margin: 16,
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
  },
  selectedSquare: {
    backgroundColor: 'rgba(255, 255, 0, 0.5)', // Highlight selected square
  },
  validMoveSquare: {
    backgroundColor: 'rgba(0, 255, 0, 0.3)', // Highlight valid move squares
  },
  pieceImage: {
    width: SQUARE_SIZE * 0.8,
    height: SQUARE_SIZE * 0.8,
  },
  fileLabels: {
    flexDirection: 'row',
    marginLeft: SQUARE_SIZE, // Space for rank label
  },
  label: {
    width: SQUARE_SIZE,
    textAlign: 'center',
    marginBottom: 4,
  },
  rankLabel: {
    width: SQUARE_SIZE / 2,
    textAlign: 'center',
    lineHeight: SQUARE_SIZE,
  },
});

export default CustomChessBoard;








// import React, { useState, useEffect } from 'react';
// import { View, StyleSheet, Dimensions, TouchableOpacity, Image, Text } from 'react-native';
// import { Chess, Square } from 'chess.js';
// import { SvgUri } from 'react-native-svg';

// const { width } = Dimensions.get('window');
// const BOARD_SIZE = Math.floor(width) - 32; // Subtract padding
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

//   const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
//   const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
//   // Reverse orientation if black
//   const displayFiles = orientation === 'black' ? [...files].reverse() : files;
//   const displayRanks = orientation === 'black' ? [...ranks].reverse() : ranks;

//   useEffect(() => {
//     try {
//       const newGame = new Chess(fen);
//       setGame(newGame);
//       updateBoardState(newGame);
//     } catch (error) {
//       console.error('Invalid FEN:', error);
//     }
//   }, [fen]);

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

//   const handleSquarePress = (square: Square) => {
//     if (selectedSquare === null) {
//       const piece = game.get(square);
//       if (piece && (piece.color === 'w' && game.turn() === 'w' || piece.color === 'b' && game.turn() === 'b')) {
//         setSelectedSquare(square);
//         const moves = game.moves({ square, verbose: true });
//         setValidMoves(moves.map(move => move.to));
//       }
//     } else {
//       if (square !== selectedSquare) {
//         if (validMoves.includes(square)) {
//           const piece = game.get(selectedSquare);
//           let promotion = undefined;
          
//           if (piece && piece.type === 'p') {
//             const targetRank = square.charAt(1);
//             if ((piece.color === 'w' && targetRank === '8') || (piece.color === 'b' && targetRank === '1')) {
//               promotion = 'q';
//             }
//           }

//           try {
//             const moveObj = { from: selectedSquare, to: square, promotion };
//             const result = game.move(moveObj);

//             if (result) {
//               updateBoardState(game);

//               if (onMove) onMove(moveObj);
//             }
//           } catch (error) {
//             console.error('Invalid move:', error);
//           }
//         }

//         setSelectedSquare(null);
//         setValidMoves([]);
//       } else {
//         setSelectedSquare(null);
//         setValidMoves([]);
//       }
//     }
//   };

//   const getPieceImage = (piece: any) => {
//     if (!piece) return null;

//     const pieceKey = `${piece.color}${piece.type.toUpperCase()}`;
    
//     if (customPieces && customPieces[pieceKey]) {
//       return (
//         <SvgUri 
//           width={SQUARE_SIZE * 0.8} 
//           height={SQUARE_SIZE * 0.8} 
//           uri={Image.resolveAssetSource(customPieces[pieceKey]).uri}
//         />
//       );
//     }
    
//     return null;
//   };

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
//         {piece && getPieceImage(piece)}
//       </TouchableOpacity>
//     );
//   };

//   const renderBoard = () => {
//     const squares = [];

//     squares.push(
//       <View key="files" style={styles.fileLabels}>
//         {displayFiles.map(file => (
//           <Text key={file} style={styles.label}>{file}</Text>
//         ))}
//       </View>
//     );

//     for (let r = 0; r < 8; r++) {
//       const rowSquares = [];

//       rowSquares.push(
//         <Text key={`rank-${displayRanks[r]}`} style={styles.rankLabel}>
//           {displayRanks[r]}
//         </Text>
//       );

//       for (let f = 0; f < 8; f++) {
//         const squareColor = (r + f) % 2 === 0 ? '#EBECD0' : '#779556';
//         const squareIndex = orientation === 'black' ? (7 - r) * 8 + (7 - f) : r * 8 + f;
        
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



