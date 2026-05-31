"""Lexer / tokenizer for White Lily Script."""

import re
from whitescript.errors import LexerError

KEYWORDS = {
    "bloom": "BLOOM",
    "flower": "FLOWER",
    "blossom": "BLOSSOM",
    "garden": "GARDEN",
    "petal": "PETAL",
    "vine": "VINE",
    "dew": "DEW",
    "if": "IF",
    "elif": "ELIF",
    "else": "ELSE",
    "and": "AND",
    "or": "OR",
    "not": "NOT",
    "true": "TRUE",
    "false": "FALSE",
    "none": "NONE",
    "lily": "LILY",
    "crystal": "CRYSTAL",
    "bloom_type": "BLOOM_TYPE",
    "in": "IN",
}

TOKEN_SPEC = [
    ("NUMBER", r"\d+(\.\d+)?"),
    ("STRING", r'"[^"]*"|' + "'[^']*'"),
    ("IDENT", r"[a-zA-Z_]\w*"),
    ("COMMENT", r"#[^\n]*"),
    ("NEWLINE", r"\n"),
    ("SKIP", r"[ \t\r]+"),
    ("CONCAT", r"\.\."),
    ("PLUS", r"\+"),
    ("MINUS", r"-"),
    ("STAR", r"\*"),
    ("SLASH", r"/"),
    ("MOD", r"%"),
    ("EQ", r"=="),
    ("NEQ", r"!="),
    ("LTE", r"<="),
    ("GTE", r">="),
    ("LT", r"<"),
    ("GT", r">"),
    ("ASSIGN", r"="),
    ("LPAREN", r"\("),
    ("RPAREN", r"\)"),
    ("LBRACE", r"\{"),
    ("RBRACE", r"\}"),
    ("LBRACKET", r"\["),
    ("RBRACKET", r"\]"),
    ("COLON", r":"),
    ("COMMA", r","),
    ("DOT", r"\."),
    ("ARROW", r"->"),
]

TOKEN_REGEX = re.compile(
    "|".join(f"(?P<{name}>{pattern})" for name, pattern in TOKEN_SPEC)
)


class Token:
    def __init__(self, kind, value, line, col):
        self.kind = kind
        self.value = value
        self.line = line
        self.col = col

    def __repr__(self):
        return f"Token({self.kind}, {self.value!r}, L:{self.line}, C:{self.col})"


class Lexer:
    def __init__(self, source, filename="<stdin>"):
        self.source = source
        self.filename = filename
        self.pos = 0
        self.line = 1
        self.col = 1
        self.tokens = []
        self._tokenize()

    def _error(self, msg):
        raise LexerError(msg, line=self.line, col=self.col, source=self.filename)

    def _tokenize(self):
        for match in re.finditer(TOKEN_REGEX, self.source):
            kind = match.lastgroup
            value = match.group()
            start = match.start()

            if start != self.pos:
                text = self.source[self.pos : start]
                if text.strip() and not text.startswith("#"):
                    self._error(f"Unexpected character: {text[0]!r}")

            self.pos = match.end()

            if kind == "SKIP":
                self.col += len(value)
                continue
            elif kind == "COMMENT":
                self.col += len(value)
                continue
            elif kind == "NEWLINE":
                self.line += 1
                self.col = 1
                self.tokens.append(Token("NEWLINE", "\n", self.line - 1, self.col))
                continue
            elif kind == "IDENT":
                self.col += len(value)
                kind = KEYWORDS.get(value, "IDENT")
            else:
                self.col += len(value)

            self.tokens.append(Token(kind, value, self.line, self.col - len(value)))

        self.tokens.append(Token("EOF", "", self.line, self.col))
