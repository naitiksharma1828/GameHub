// Tic-Tac-Toe engine with minimax AI.
#pragma once
#include <array>

namespace games {

// Board cells: 0 empty, 1 = X, 2 = O.
using TttBoard = std::array<int, 9>;

class TicTacToe {
public:
    // Returns 0 = ongoing, 1 = X wins, 2 = O wins, 3 = draw.
    static int status(const TttBoard& b);

    // Best move for `player` (1 or 2) using minimax. Returns cell index (-1 none).
    static int bestMove(const TttBoard& b, int player);
};

} // namespace games
