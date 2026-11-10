// Chess engine: legal move generation, validation, check/checkmate/stalemate.
#pragma once
#include <string>
#include <vector>

namespace games {

struct ChessMove {
    int from;       // 0..63 (a8 = 0 ... h1 = 63, rank-major from top)
    int to;
    char promotion; // 'q','r','b','n' or 0
};

class Chess {
public:
    Chess();
    void reset();

    // Load a position from FEN.
    bool loadFen(const std::string& fen);
    std::string fen() const;

    // Board as 64-char string, '.' for empty, piece letters otherwise
    // (uppercase white, lowercase black), index 0 = a8.
    std::string boardString() const;

    // 'w' or 'b'
    char turn() const { return whiteToMove_ ? 'w' : 'b'; }

    // All legal moves in current position.
    std::vector<ChessMove> legalMoves() const;

    // Legal moves originating from a square.
    std::vector<ChessMove> legalMovesFrom(int square) const;

    // Attempt a move. Returns true if applied.
    bool move(int from, int to, char promotion = 0);

    bool inCheck() const;
    bool inCheckmate() const;
    bool inStalemate() const;
    bool isGameOver() const;

    // Generate PGN-ish SAN for last move list (simple algebraic).
    const std::vector<std::string>& history() const { return sanHistory_; }

private:
    // board_[64]: 0 empty; positive white, negative black.
    // 1=P 2=N 3=B 4=R 5=Q 6=K
    int board_[64];
    bool whiteToMove_;
    int enPassant_;      // target square or -1
    bool castleWK_, castleWQ_, castleBK_, castleBQ_;
    std::vector<std::string> sanHistory_;

    void generatePseudo(std::vector<ChessMove>& out) const;
    bool isSquareAttacked(int sq, bool byWhite) const;
    int kingSquare(bool white) const;
    void applyMove(const ChessMove& m);
    bool sameColor(int a, int b) const;
    std::string sanFor(const ChessMove& m) const;
};

} // namespace games
