#include "sudoku.h"
#include <random>
#include <algorithm>
#include <numeric>
#include <functional>

namespace games {

static inline int row(int idx) { return idx / 9; }
static inline int col(int idx) { return idx % 9; }
static inline int box(int idx) { return (row(idx) / 3) * 3 + (col(idx) / 3); }

bool Sudoku::isValidMove(const SudokuGrid& grid, int idx, int val) {
    if (val < 1 || val > 9) return false;
    int r = row(idx), c = col(idx);
    for (int i = 0; i < 9; ++i) {
        if (i != c && grid[r * 9 + i] == val) return false; // row
        if (i != r && grid[i * 9 + c] == val) return false; // column
    }
    int br = (r / 3) * 3, bc = (c / 3) * 3;
    for (int dr = 0; dr < 3; ++dr)
        for (int dc = 0; dc < 3; ++dc) {
            int j = (br + dr) * 9 + (bc + dc);
            if (j != idx && grid[j] == val) return false; // box
        }
    return true;
}

// Find the empty cell with the fewest candidates (MRV heuristic).
static int findBestEmpty(const SudokuGrid& grid) {
    int best = -1, bestCount = 10;
    for (int i = 0; i < 81; ++i) {
        if (grid[i] != 0) continue;
        int count = 0;
        for (int v = 1; v <= 9; ++v)
            if (Sudoku::isValidMove(grid, i, v)) ++count;
        if (count < bestCount) {
            bestCount = count;
            best = i;
            if (count <= 1) break;
        }
    }
    return best;
}

bool Sudoku::solve(SudokuGrid& grid) {
    int idx = findBestEmpty(grid);
    if (idx == -1) return true; // solved
    for (int v = 1; v <= 9; ++v) {
        if (isValidMove(grid, idx, v)) {
            grid[idx] = v;
            if (solve(grid)) return true;
            grid[idx] = 0;
        }
    }
    return false;
}

int Sudoku::countSolutions(SudokuGrid grid, int limit) {
    int idx = -1;
    for (int i = 0; i < 81; ++i)
        if (grid[i] == 0) { idx = i; break; }
    if (idx == -1) return 1;
    int total = 0;
    for (int v = 1; v <= 9 && total < limit; ++v) {
        if (isValidMove(grid, idx, v)) {
            grid[idx] = v;
            total += countSolutions(grid, limit - total);
            grid[idx] = 0;
        }
    }
    return total;
}

SudokuGrid Sudoku::generateSolved(unsigned int seed) {
    std::mt19937 rng(seed);
    SudokuGrid grid{};
    grid.fill(0);

    // Randomized backtracking fill.
    std::function<bool(int)> fill = [&](int) -> bool {
        int idx = -1;
        for (int i = 0; i < 81; ++i)
            if (grid[i] == 0) { idx = i; break; }
        if (idx == -1) return true;
        std::array<int, 9> nums;
        std::iota(nums.begin(), nums.end(), 1);
        std::shuffle(nums.begin(), nums.end(), rng);
        for (int v : nums) {
            if (isValidMove(grid, idx, v)) {
                grid[idx] = v;
                if (fill(0)) return true;
                grid[idx] = 0;
            }
        }
        return false;
    };
    fill(0);
    return grid;
}

void Sudoku::generatePuzzle(unsigned int seed, int clues,
                            SudokuGrid& puzzle, SudokuGrid& solution) {
    std::mt19937 rng(seed);
    solution = generateSolved(seed);
    puzzle = solution;

    std::array<int, 81> order;
    std::iota(order.begin(), order.end(), 0);
    std::shuffle(order.begin(), order.end(), rng);

    int remaining = 81;
    for (int idx : order) {
        if (remaining <= clues) break;
        int backup = puzzle[idx];
        if (backup == 0) continue;
        puzzle[idx] = 0;
        // Keep removal only if solution remains unique.
        if (countSolutions(puzzle, 2) != 1) {
            puzzle[idx] = backup; // restore
        } else {
            --remaining;
        }
    }
}

} // namespace games
