"""Pygments lexer for White Lily Script (.wlily)."""

from pygments.lexer import RegexLexer, words, include
from pygments.token import *


class WhiteLilyScriptLexer(RegexLexer):
    name = "White Lily Script"
    aliases = ["wlily", "whitelily"]
    filenames = ["*.wlily"]

    tokens = {
        "root": [
            (r"#.*$", Comment.Single),
            (r"\"[^\"]*\"", String.Double),
            (r"'[^']*'", String.Single),
            (r"\d+\.\d*", Number.Float),
            (r"\d+", Number.Integer),
            (words(("bloom", "flower", "blossom", "garden", "petal", "vine", "dew"),
                   prefix=r"\b", suffix=r"\b"), Keyword),
            (words(("if", "elif", "else"), prefix=r"\b", suffix=r"\b"), Keyword),
            (words(("and", "or", "not"), prefix=r"\b", suffix=r"\b"), Operator.Word),
            (words(("true", "false"), prefix=r"\b", suffix=r"\b"), Keyword.Constant),
            (r"\bnone\b", Name.Builtin),
            (words(("lily", "crystal", "bloom_type", "garden"), prefix=r"\b", suffix=r"\b"), Keyword.Type),
            (words(("len", "range", "type", "int", "str", "float", "sleep", "randint", "sqrt"),
                   prefix=r"\b", suffix=r"\b"), Name.Builtin),
            (r"[a-zA-Z_]\w*", Name),
            (r"[+\-*/%]", Operator),
            (r"[=<>!]=?", Operator),
            (r"\.\.", Operator),
            (r"[(),\[\]{}:]", Punctuation),
            (r"\s+", Text),
        ],
    }
