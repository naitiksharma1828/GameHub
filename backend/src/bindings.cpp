// Emscripten bindings — the single bridge between the C++ backend
// and the JavaScript/TypeScript frontend.
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <string>
#include <vector>

#include "sudoku.h"
#include "tictactoe.h"
#include "puzzle.h"
#include "chess.h"

using namespace emscripten;
using namespace games;

// ---------- Helpers to convert between JS arrays and C++ vectors ----------
static std::vector<int> toVector(const val& arr) {
    unsigned len = arr["length"].as<unsigned>();
    std::vector<int> out(len);
    for (unsigned i = 0; i < len; ++i) out[i] = arr[i].as<int>();
    return out;
}

static val toJsArray(const std::vector<int>& v) {
    val arr = val::array();
    for (size_t i = 0; i < v.size(); ++i) arr.set(i, v[i]);
    return arr;
}

// ---------------------------- Sudoku ----------------------------
struct SudokuResult {
    val puzzle = val::array();
    val solution = val::array();
};

SudokuResult sudokuGenerate(unsigned int seed, int clues) {
    SudokuGrid puzzle{}, solution{};
    Sudoku::generatePuzzle(seed, clues, puzzle, solution);
    SudokuResult r;
    std::vector<int> p(puzzle.begin(), puzzle.end());
    std::vector<int> s(solution.begin(), solution.end());
    r.puzzle = toJsArray(p);
    r.solution = toJsArray(s);
    return r;
}

val sudokuSolve(const val& gridJs) {
    std::vector<int> g = toVector(gridJs);
    SudokuGrid grid{};
    for (int i = 0; i < 81 && i < (int)g.size(); ++i) grid[i] = g[i];
    Sudoku::solve(grid);
    std::vector<int> out(grid.begin(), grid.end());
    return toJsArray(out);
}

bool sudokuValid(const val& gridJs, int idx, int val_) {
    std::vector<int> g = toVector(gridJs);
    SudokuGrid grid{};
    for (int i = 0; i < 81 && i < (int)g.size(); ++i) grid[i] = g[i];
    return Sudoku::isValidMove(grid, idx, val_);
}

// -------------------------- Tic-Tac-Toe -------------------------
int tttStatus(const val& boardJs) {
    std::vector<int> b = toVector(boardJs);
    TttBoard board{};
    for (int i = 0; i < 9 && i < (int)b.size(); ++i) board[i] = b[i];
    return TicTacToe::status(board);
}

int tttBestMove(const val& boardJs, int player) {
    std::vector<int> b = toVector(boardJs);
    TttBoard board{};
    for (int i = 0; i < 9 && i < (int)b.size(); ++i) board[i] = b[i];
    return TicTacToe::bestMove(board, player);
}

// ---------------------------- Puzzle ----------------------------
val puzzleShuffle(int n, unsigned int seed) {
    return toJsArray(Puzzle::shuffle(n, seed));
}
bool puzzleSolvable(const val& boardJs, int n) {
    return Puzzle::isSolvable(toVector(boardJs), n);
}
val puzzleSolve(const val& boardJs, int n) {
    return toJsArray(Puzzle::solve(toVector(boardJs), n));
}

// ----------------------------- Chess ----------------------------
// Wrapper exposing a stateful engine instance to JS.
class ChessEngine {
public:
    ChessEngine() {}
    void reset() { game_.reset(); }
    bool loadFen(const std::string& f) { return game_.loadFen(f); }
    std::string fen() const { return game_.fen(); }
    std::string board() const { return game_.boardString(); }
    std::string turn() const { return std::string(1, game_.turn()); }
    bool move(int from, int to, const std::string& promo) {
        char p = promo.empty() ? 0 : promo[0];
        return game_.move(from, to, p);
    }
    // Returns flat array [from,to, from,to, ...] of destinations from a square.
    val movesFrom(int sq) const {
        auto ms = game_.legalMovesFrom(sq);
        val arr = val::array();
        int i = 0;
        for (auto& m : ms) {
            val o = val::object();
            o.set("from", m.from);
            o.set("to", m.to);
            o.set("promotion", std::string(m.promotion ? std::string(1, m.promotion) : ""));
            arr.set(i++, o);
        }
        return arr;
    }
    int legalCount() const { return (int)game_.legalMoves().size(); }
    bool inCheck() const { return game_.inCheck(); }
    bool inCheckmate() const { return game_.inCheckmate(); }
    bool inStalemate() const { return game_.inStalemate(); }
    bool isGameOver() const { return game_.isGameOver(); }
    val history() const {
        val arr = val::array();
        auto& h = game_.history();
        for (size_t i = 0; i < h.size(); ++i) arr.set(i, h[i]);
        return arr;
    }
private:
    Chess game_;
};

EMSCRIPTEN_BINDINGS(games_module) {
    value_object<SudokuResult>("SudokuResult")
        .field("puzzle", &SudokuResult::puzzle)
        .field("solution", &SudokuResult::solution);

    function("sudokuGenerate", &sudokuGenerate);
    function("sudokuSolve", &sudokuSolve);
    function("sudokuValid", &sudokuValid);

    function("tttStatus", &tttStatus);
    function("tttBestMove", &tttBestMove);

    function("puzzleShuffle", &puzzleShuffle);
    function("puzzleSolvable", &puzzleSolvable);
    function("puzzleSolve", &puzzleSolve);

    class_<ChessEngine>("ChessEngine")
        .constructor<>()
        .function("reset", &ChessEngine::reset)
        .function("loadFen", &ChessEngine::loadFen)
        .function("fen", &ChessEngine::fen)
        .function("board", &ChessEngine::board)
        .function("turn", &ChessEngine::turn)
        .function("move", &ChessEngine::move)
        .function("movesFrom", &ChessEngine::movesFrom)
        .function("legalCount", &ChessEngine::legalCount)
        .function("inCheck", &ChessEngine::inCheck)
        .function("inCheckmate", &ChessEngine::inCheckmate)
        .function("inStalemate", &ChessEngine::inStalemate)
        .function("isGameOver", &ChessEngine::isGameOver)
        .function("history", &ChessEngine::history);
}
