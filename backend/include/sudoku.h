// Sudoku engine: generation, solving, validation.
#pragma once
#include <array>
#include <string>

namespace games {

// A Sudoku board is 81 cells (0 == empty).
using SudokuGrid = std::array<int, 81>;

class Sudoku {
public:
    // Solve the given grid in place using backtracking.
    // Returns true if a solution was found.
    static bool solve(SudokuGrid& grid);

    // Count solutions up to `limit` (used to guarantee uniqueness).
    static int countSolutions(SudokuGrid grid, int limit = 2);

    // Generate a fully solved board.
    static SudokuGrid generateSolved(unsigned int seed);

    // Generate a puzzle with a unique solution.
    // `clues` controls difficulty (higher = easier).
    static void generatePuzzle(unsigned int seed, int clues,
                               SudokuGrid& puzzle, SudokuGrid& solution);

    // Check whether placing `val` at `idx` is currently valid.
    static bool isValidMove(const SudokuGrid& grid, int idx, int val);
};

} // namespace games
