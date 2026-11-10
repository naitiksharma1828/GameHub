// N-Puzzle (sliding tile) engine: shuffle, solvability, A* solver.
#pragma once
#include <vector>

namespace games {

class Puzzle {
public:
    // Generate a solvable shuffled board of size n (n x n). 0 = blank.
    static std::vector<int> shuffle(int n, unsigned int seed);

    // Check solvability of a configuration.
    static bool isSolvable(const std::vector<int>& board, int n);

    // Solve using A* with Manhattan distance.
    // Returns the sequence of blank-tile indices representing moves,
    // i.e. the ordered list of board states' blank positions.
    // Returns the flattened sequence of tiles that slide into the blank.
    static std::vector<int> solve(const std::vector<int>& board, int n);
};

} // namespace games
