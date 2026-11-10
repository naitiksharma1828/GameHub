#include "puzzle.h"
#include <random>
#include <algorithm>
#include <numeric>
#include <queue>
#include <unordered_map>
#include <string>

namespace games {

bool Puzzle::isSolvable(const std::vector<int>& board, int n) {
    int inversions = 0;
    std::vector<int> flat;
    for (int v : board) if (v != 0) flat.push_back(v);
    for (size_t i = 0; i < flat.size(); ++i)
        for (size_t j = i + 1; j < flat.size(); ++j)
            if (flat[i] > flat[j]) ++inversions;

    if (n % 2 == 1) {
        return inversions % 2 == 0;
    } else {
        int blankIndex = 0;
        for (int i = 0; i < (int)board.size(); ++i)
            if (board[i] == 0) { blankIndex = i; break; }
        int blankRowFromBottom = n - (blankIndex / n);
        if (blankRowFromBottom % 2 == 0)
            return inversions % 2 == 1;
        else
            return inversions % 2 == 0;
    }
}

std::vector<int> Puzzle::shuffle(int n, unsigned int seed) {
    std::mt19937 rng(seed);
    std::vector<int> board(n * n);
    std::iota(board.begin(), board.end(), 0);
    do {
        std::shuffle(board.begin(), board.end(), rng);
    } while (!isSolvable(board, n) ||
             std::is_sorted(board.begin(), board.end() - 1)); // avoid solved/trivial
    return board;
}

// ---- A* solver ----
namespace {

int manhattan(const std::vector<int>& b, int n) {
    int dist = 0;
    for (int i = 0; i < (int)b.size(); ++i) {
        int v = b[i];
        if (v == 0) continue;
        int target = v; // goal: tile v at index v (blank last handled separately)
        int cr = i / n, cc = i % n;
        int tr = target / n, tc = target % n;
        dist += std::abs(cr - tr) + std::abs(cc - tc);
    }
    return dist;
}

std::string key(const std::vector<int>& b) {
    std::string s;
    s.reserve(b.size());
    for (int v : b) s.push_back((char)(v + 1));
    return s;
}

struct Node {
    std::vector<int> board;
    int blank;
    int g;
    int f;
};

struct Cmp {
    bool operator()(const Node& a, const Node& b) const { return a.f > b.f; }
};

} // namespace

std::vector<int> Puzzle::solve(const std::vector<int>& start, int n) {
    std::vector<int> goal(n * n);
    std::iota(goal.begin(), goal.end(), 0);
    std::string goalKey = key(goal);

    int startBlank = 0;
    for (int i = 0; i < (int)start.size(); ++i)
        if (start[i] == 0) { startBlank = i; break; }

    std::priority_queue<Node, std::vector<Node>, Cmp> open;
    std::unordered_map<std::string, int> gScore;
    // parent map: child key -> {parent key, tile that moved}
    std::unordered_map<std::string, std::pair<std::string, int>> parent;

    open.push({start, startBlank, 0, manhattan(start, n)});
    gScore[key(start)] = 0;

    const int dr[4] = {-1, 1, 0, 0};
    const int dc[4] = {0, 0, -1, 1};

    int iterations = 0;
    const int MAX_ITER = 500000; // safety bound

    while (!open.empty() && iterations++ < MAX_ITER) {
        Node cur = open.top();
        open.pop();
        std::string ck = key(cur.board);
        if (ck == goalKey) {
            // reconstruct sequence of moved tiles
            std::vector<int> moves;
            std::string k = ck;
            while (parent.count(k)) {
                moves.push_back(parent[k].second);
                k = parent[k].first;
            }
            std::reverse(moves.begin(), moves.end());
            return moves;
        }
        if (gScore.count(ck) && gScore[ck] < cur.g) continue;

        int br = cur.blank / n, bc = cur.blank % n;
        for (int d = 0; d < 4; ++d) {
            int nr = br + dr[d], nc = bc + dc[d];
            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
            int ni = nr * n + nc;
            std::vector<int> nb = cur.board;
            int movedTile = nb[ni];
            std::swap(nb[cur.blank], nb[ni]);
            std::string nk = key(nb);
            int ng = cur.g + 1;
            if (!gScore.count(nk) || ng < gScore[nk]) {
                gScore[nk] = ng;
                parent[nk] = {ck, movedTile};
                open.push({nb, ni, ng, ng + manhattan(nb, n)});
            }
        }
    }
    return {}; // no solution found within bounds
}

} // namespace games
