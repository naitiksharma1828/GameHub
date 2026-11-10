#include "chess.h"
#include <cctype>
#include <cstdlib>
#include <sstream>

namespace games {

// Piece codes
enum { PW = 1, NW = 2, BW = 3, RW = 4, QW = 5, KW = 6 };

static inline int rankOf(int sq) { return sq / 8; }
static inline int fileOf(int sq) { return sq % 8; }
static inline bool onBoard(int r, int f) { return r >= 0 && r < 8 && f >= 0 && f < 8; }
static inline char pieceChar(int p) {
    const char* w = "PNBRQK";
    if (p == 0) return '.';
    char c = w[std::abs(p) - 1];
    return p > 0 ? c : (char)std::tolower(c);
}

Chess::Chess() { reset(); }

void Chess::reset() {
    loadFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    sanHistory_.clear();
}

bool Chess::loadFen(const std::string& fen) {
    for (int i = 0; i < 64; ++i) board_[i] = 0;
    std::istringstream ss(fen);
    std::string placement, active, castle, ep;
    ss >> placement >> active >> castle >> ep;
    if (placement.empty()) return false;

    int sq = 0;
    for (char c : placement) {
        if (c == '/') continue;
        if (std::isdigit(c)) { sq += c - '0'; continue; }
        int piece = 0;
        char up = std::toupper(c);
        switch (up) {
            case 'P': piece = PW; break;
            case 'N': piece = NW; break;
            case 'B': piece = BW; break;
            case 'R': piece = RW; break;
            case 'Q': piece = QW; break;
            case 'K': piece = KW; break;
            default: return false;
        }
        if (std::islower(c)) piece = -piece;
        if (sq < 64) board_[sq++] = piece;
    }
    whiteToMove_ = (active != "b");
    castleWK_ = castle.find('K') != std::string::npos;
    castleWQ_ = castle.find('Q') != std::string::npos;
    castleBK_ = castle.find('k') != std::string::npos;
    castleBQ_ = castle.find('q') != std::string::npos;
    if (ep.size() == 2 && ep != "-") {
        int f = ep[0] - 'a';
        int r = 8 - (ep[1] - '0');
        enPassant_ = r * 8 + f;
    } else {
        enPassant_ = -1;
    }
    return true;
}

std::string Chess::boardString() const {
    std::string s(64, '.');
    for (int i = 0; i < 64; ++i) s[i] = pieceChar(board_[i]);
    return s;
}

std::string Chess::fen() const {
    std::string s;
    for (int r = 0; r < 8; ++r) {
        int empty = 0;
        for (int f = 0; f < 8; ++f) {
            int p = board_[r * 8 + f];
            if (p == 0) { ++empty; continue; }
            if (empty) { s += std::to_string(empty); empty = 0; }
            s += pieceChar(p);
        }
        if (empty) s += std::to_string(empty);
        if (r != 7) s += '/';
    }
    s += whiteToMove_ ? " w " : " b ";
    std::string c;
    if (castleWK_) c += 'K';
    if (castleWQ_) c += 'Q';
    if (castleBK_) c += 'k';
    if (castleBQ_) c += 'q';
    s += c.empty() ? "-" : c;
    s += ' ';
    if (enPassant_ >= 0) {
        s += (char)('a' + fileOf(enPassant_));
        s += (char)('0' + (8 - rankOf(enPassant_)));
    } else s += '-';
    s += " 0 1";
    return s;
}

bool Chess::sameColor(int a, int b) const {
    if (a == 0 || b == 0) return false;
    return (a > 0) == (b > 0);
}

int Chess::kingSquare(bool white) const {
    int target = white ? KW : -KW;
    for (int i = 0; i < 64; ++i) if (board_[i] == target) return i;
    return -1;
}

bool Chess::isSquareAttacked(int sq, bool byWhite) const {
    int r = rankOf(sq), f = fileOf(sq);
    int sign = byWhite ? 1 : -1;

    // Pawns: white pawns attack upward (decreasing rank)
    int pdr = byWhite ? 1 : -1; // attacker sits at rank r+pdr
    for (int df = -1; df <= 1; df += 2) {
        int ar = r + pdr, af = f + df;
        if (onBoard(ar, af) && board_[ar * 8 + af] == sign * PW) return true;
    }
    // Knights
    const int kd[8][2] = {{-2,-1},{-2,1},{-1,-2},{-1,2},{1,-2},{1,2},{2,-1},{2,1}};
    for (auto& d : kd) {
        int ar = r + d[0], af = f + d[1];
        if (onBoard(ar, af) && board_[ar * 8 + af] == sign * NW) return true;
    }
    // King
    for (int dr = -1; dr <= 1; ++dr)
        for (int dfl = -1; dfl <= 1; ++dfl) {
            if (!dr && !dfl) continue;
            int ar = r + dr, af = f + dfl;
            if (onBoard(ar, af) && board_[ar * 8 + af] == sign * KW) return true;
        }
    // Sliding: bishops/queens (diagonals)
    const int bdir[4][2] = {{-1,-1},{-1,1},{1,-1},{1,1}};
    for (auto& d : bdir) {
        int ar = r + d[0], af = f + d[1];
        while (onBoard(ar, af)) {
            int p = board_[ar * 8 + af];
            if (p != 0) {
                if (p == sign * BW || p == sign * QW) return true;
                break;
            }
            ar += d[0]; af += d[1];
        }
    }
    // Sliding: rooks/queens (orthogonal)
    const int rdir[4][2] = {{-1,0},{1,0},{0,-1},{0,1}};
    for (auto& d : rdir) {
        int ar = r + d[0], af = f + d[1];
        while (onBoard(ar, af)) {
            int p = board_[ar * 8 + af];
            if (p != 0) {
                if (p == sign * RW || p == sign * QW) return true;
                break;
            }
            ar += d[0]; af += d[1];
        }
    }
    return false;
}

void Chess::generatePseudo(std::vector<ChessMove>& out) const {
    bool white = whiteToMove_;
    int sign = white ? 1 : -1;
    for (int sq = 0; sq < 64; ++sq) {
        int p = board_[sq];
        if (p == 0 || (p > 0) != white) continue;
        int r = rankOf(sq), f = fileOf(sq);
        int type = std::abs(p);

        auto addPromoOrNormal = [&](int to) {
            int tr = rankOf(to);
            if (type == PW && (tr == 0 || tr == 7)) {
                for (char pr : {'q','r','b','n'}) out.push_back({sq, to, pr});
            } else {
                out.push_back({sq, to, 0});
            }
        };

        if (type == PW) {
            int dir = white ? -1 : 1; // white moves up (decreasing rank)
            int startRank = white ? 6 : 1;
            int nr = r + dir;
            if (onBoard(nr, f) && board_[nr * 8 + f] == 0) {
                addPromoOrNormal(nr * 8 + f);
                if (r == startRank && board_[(r + 2 * dir) * 8 + f] == 0)
                    out.push_back({sq, (r + 2 * dir) * 8 + f, 0});
            }
            for (int df = -1; df <= 1; df += 2) {
                int cf = f + df;
                if (!onBoard(nr, cf)) continue;
                int to = nr * 8 + cf;
                int tp = board_[to];
                if ((tp != 0 && (tp > 0) != white) || to == enPassant_)
                    addPromoOrNormal(to);
            }
        } else if (type == NW) {
            const int kd[8][2] = {{-2,-1},{-2,1},{-1,-2},{-1,2},{1,-2},{1,2},{2,-1},{2,1}};
            for (auto& d : kd) {
                int ar = r + d[0], af = f + d[1];
                if (!onBoard(ar, af)) continue;
                int to = ar * 8 + af;
                if (board_[to] == 0 || (board_[to] > 0) != white)
                    out.push_back({sq, to, 0});
            }
        } else if (type == KW) {
            for (int dr = -1; dr <= 1; ++dr)
                for (int df = -1; df <= 1; ++df) {
                    if (!dr && !df) continue;
                    int ar = r + dr, af = f + df;
                    if (!onBoard(ar, af)) continue;
                    int to = ar * 8 + af;
                    if (board_[to] == 0 || (board_[to] > 0) != white)
                        out.push_back({sq, to, 0});
                }
            // Castling
            bool ks = white ? castleWK_ : castleBK_;
            bool qs = white ? castleWQ_ : castleBQ_;
            int backRank = white ? 7 : 0;
            if (r == backRank && f == 4 && !isSquareAttacked(sq, !white)) {
                if (ks && board_[backRank*8+5]==0 && board_[backRank*8+6]==0 &&
                    !isSquareAttacked(backRank*8+5, !white) &&
                    !isSquareAttacked(backRank*8+6, !white))
                    out.push_back({sq, backRank*8+6, 0});
                if (qs && board_[backRank*8+3]==0 && board_[backRank*8+2]==0 &&
                    board_[backRank*8+1]==0 &&
                    !isSquareAttacked(backRank*8+3, !white) &&
                    !isSquareAttacked(backRank*8+2, !white))
                    out.push_back({sq, backRank*8+2, 0});
            }
        } else {
            // sliding pieces
            std::vector<std::pair<int,int>> dirs;
            if (type == BW || type == QW)
                dirs.insert(dirs.end(), {{-1,-1},{-1,1},{1,-1},{1,1}});
            if (type == RW || type == QW)
                dirs.insert(dirs.end(), {{-1,0},{1,0},{0,-1},{0,1}});
            for (auto& d : dirs) {
                int ar = r + d.first, af = f + d.second;
                while (onBoard(ar, af)) {
                    int to = ar * 8 + af;
                    if (board_[to] == 0) {
                        out.push_back({sq, to, 0});
                    } else {
                        if ((board_[to] > 0) != white) out.push_back({sq, to, 0});
                        break;
                    }
                    ar += d.first; af += d.second;
                }
            }
        }
        (void)sign;
    }
}

void Chess::applyMove(const ChessMove& m) {
    int piece = board_[m.from];
    int type = std::abs(piece);
    bool white = piece > 0;

    // En passant capture
    if (type == PW && m.to == enPassant_ && board_[m.to] == 0) {
        int capRank = rankOf(m.from);
        board_[capRank * 8 + fileOf(m.to)] = 0;
    }

    int newEp = -1;
    if (type == PW && std::abs(rankOf(m.to) - rankOf(m.from)) == 2) {
        newEp = (rankOf(m.from) + rankOf(m.to)) / 2 * 8 + fileOf(m.from);
    }

    // Castling rook move
    if (type == KW && std::abs(fileOf(m.to) - fileOf(m.from)) == 2) {
        int br = rankOf(m.from);
        if (fileOf(m.to) == 6) { // kingside
            board_[br*8+5] = board_[br*8+7];
            board_[br*8+7] = 0;
        } else { // queenside
            board_[br*8+3] = board_[br*8+0];
            board_[br*8+0] = 0;
        }
    }

    board_[m.to] = piece;
    board_[m.from] = 0;

    // Promotion
    if (m.promotion) {
        int np = QW;
        switch (m.promotion) {
            case 'q': np = QW; break;
            case 'r': np = RW; break;
            case 'b': np = BW; break;
            case 'n': np = NW; break;
        }
        board_[m.to] = white ? np : -np;
    }

    // Update castling rights
    if (type == KW) {
        if (white) { castleWK_ = castleWQ_ = false; }
        else { castleBK_ = castleBQ_ = false; }
    }
    if (m.from == 63 || m.to == 63) castleWK_ = false;
    if (m.from == 56 || m.to == 56) castleWQ_ = false;
    if (m.from == 7  || m.to == 7)  castleBK_ = false;
    if (m.from == 0  || m.to == 0)  castleBQ_ = false;

    enPassant_ = newEp;
    whiteToMove_ = !whiteToMove_;
}

std::vector<ChessMove> Chess::legalMoves() const {
    std::vector<ChessMove> pseudo, legal;
    generatePseudo(pseudo);
    for (auto& m : pseudo) {
        Chess copy = *this;
        bool mover = whiteToMove_;
        copy.applyMove(m);
        int ks = copy.kingSquare(mover);
        if (ks >= 0 && !copy.isSquareAttacked(ks, !mover))
            legal.push_back(m);
    }
    return legal;
}

std::vector<ChessMove> Chess::legalMovesFrom(int square) const {
    std::vector<ChessMove> all = legalMoves(), out;
    for (auto& m : all) if (m.from == square) out.push_back(m);
    return out;
}

std::string Chess::sanFor(const ChessMove& m) const {
    // Simplified SAN for history / PGN.
    int piece = std::abs(board_[m.from]);
    const char* names = "PNBRQK";
    bool capture = board_[m.to] != 0 ||
                   (piece == PW && fileOf(m.from) != fileOf(m.to));
    std::string s;
    auto sqName = [](int sq) {
        std::string r;
        r += (char)('a' + fileOf(sq));
        r += (char)('0' + (8 - rankOf(sq)));
        return r;
    };
    if (piece == KW && std::abs(fileOf(m.to) - fileOf(m.from)) == 2) {
        return fileOf(m.to) == 6 ? "O-O" : "O-O-O";
    }
    if (piece == PW) {
        if (capture) { s += (char)('a' + fileOf(m.from)); s += 'x'; }
        s += sqName(m.to);
        if (m.promotion) { s += '='; s += (char)std::toupper(m.promotion); }
    } else {
        s += names[piece - 1];
        if (capture) s += 'x';
        s += sqName(m.to);
    }
    return s;
}

bool Chess::move(int from, int to, char promotion) {
    std::vector<ChessMove> legal = legalMoves();
    for (auto& m : legal) {
        if (m.from == from && m.to == to &&
            (promotion == 0 || m.promotion == 0 || m.promotion == promotion)) {
            std::string san = sanFor(m);
            applyMove(m);
            // annotate check/mate
            if (inCheckmate()) san += '#';
            else if (inCheck()) san += '+';
            sanHistory_.push_back(san);
            return true;
        }
    }
    return false;
}

bool Chess::inCheck() const {
    int ks = kingSquare(whiteToMove_);
    if (ks < 0) return false;
    return isSquareAttacked(ks, !whiteToMove_);
}

bool Chess::inCheckmate() const {
    return inCheck() && legalMoves().empty();
}

bool Chess::inStalemate() const {
    return !inCheck() && legalMoves().empty();
}

bool Chess::isGameOver() const {
    return legalMoves().empty();
}

} // namespace games
