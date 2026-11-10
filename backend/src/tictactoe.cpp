#include "tictactoe.h"
#include <algorithm>

namespace games {

static const int LINES[8][3] = {
    {0,1,2},{3,4,5},{6,7,8}, // rows
    {0,3,6},{1,4,7},{2,5,8}, // cols
    {0,4,8},{2,4,6}          // diagonals
};

int TicTacToe::status(const TttBoard& b) {
    for (auto& l : LINES) {
        if (b[l[0]] != 0 && b[l[0]] == b[l[1]] && b[l[1]] == b[l[2]])
            return b[l[0]]; // 1 or 2
    }
    for (int c : b) if (c == 0) return 0; // ongoing
    return 3; // draw
}

// Minimax returning score from perspective of `me`.
static int minimax(TttBoard& b, int turn, int me, int depth) {
    int st = TicTacToe::status(b);
    if (st == me) return 10 - depth;
    if (st == 3) return 0;
    if (st != 0) return depth - 10; // opponent wins

    int other = (me == 1) ? 2 : 1;
    bool maximizing = (turn == me);
    int best = maximizing ? -1000 : 1000;
    int next = (turn == 1) ? 2 : 1;
    for (int i = 0; i < 9; ++i) {
        if (b[i] != 0) continue;
        b[i] = turn;
        int score = minimax(b, next, me, depth + 1);
        b[i] = 0;
        best = maximizing ? std::max(best, score) : std::min(best, score);
    }
    (void)other;
    return best;
}

int TicTacToe::bestMove(const TttBoard& board, int player) {
    TttBoard b = board;
    int bestScore = -1000, move = -1;
    int next = (player == 1) ? 2 : 1;
    for (int i = 0; i < 9; ++i) {
        if (b[i] != 0) continue;
        b[i] = player;
        int score = minimax(b, next, player, 1);
        b[i] = 0;
        if (score > bestScore) { bestScore = score; move = i; }
    }
    return move;
}

} // namespace games
