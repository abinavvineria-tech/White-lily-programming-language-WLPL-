"""Tests for the White Lily Script lexer."""

import unittest
from whitescript.lexer import Lexer


class TestLexer(unittest.TestCase):
    def test_keywords(self):
        source = "bloom flower blossom garden petal vine dew"
        lexer = Lexer(source)
        kinds = [t.kind for t in lexer.tokens if t.kind != "EOF"]
        self.assertEqual(kinds, ["BLOOM", "FLOWER", "BLOSSOM", "GARDEN", "PETAL", "VINE", "DEW"])

    def test_numbers(self):
        source = "42 3.14"
        lexer = Lexer(source)
        tokens = [t for t in lexer.tokens if t.kind != "EOF"]
        self.assertEqual(tokens[0].kind, "NUMBER")
        self.assertEqual(tokens[0].value, "42")
        self.assertEqual(tokens[1].kind, "NUMBER")
        self.assertEqual(tokens[1].value, "3.14")

    def test_strings(self):
        source = '"hello" \'world\''
        lexer = Lexer(source)
        tokens = [t for t in lexer.tokens if t.kind != "EOF"]
        self.assertEqual(tokens[0].kind, "STRING")
        self.assertEqual(tokens[0].value, '"hello"')
        self.assertEqual(tokens[1].kind, "STRING")
        self.assertEqual(tokens[1].value, "'world'")

    def test_operators(self):
        source = "+ - * / % == != < > <= >="
        lexer = Lexer(source)
        kinds = [t.kind for t in lexer.tokens if t.kind != "EOF"]
        self.assertEqual(kinds, [
            "PLUS", "MINUS", "STAR", "SLASH", "MOD",
            "EQ", "NEQ", "LT", "GT", "LTE", "GTE",
        ])

    def test_comments(self):
        source = "bloom x = 1 # this is a comment"
        lexer = Lexer(source)
        kinds = [t.kind for t in lexer.tokens if t.kind not in ("EOF", "COMMENT")]
        self.assertEqual(kinds, ["BLOOM", "IDENT", "ASSIGN", "NUMBER"])

    def test_identifiers(self):
        source = "my_variable count2 _temp"
        lexer = Lexer(source)
        kinds = [t.kind for t in lexer.tokens if t.kind != "EOF"]
        self.assertEqual(kinds, ["IDENT", "IDENT", "IDENT"])
        self.assertEqual([t.value for t in lexer.tokens if t.kind != "EOF"],
                         ["my_variable", "count2", "_temp"])

    def test_booleans(self):
        source = "true false"
        lexer = Lexer(source)
        kinds = [t.kind for t in lexer.tokens if t.kind != "EOF"]
        self.assertEqual(kinds, ["TRUE", "FALSE"])

    def test_punctuation(self):
        source = "( ) { } [ ] , : ->"
        lexer = Lexer(source)
        kinds = [t.kind for t in lexer.tokens if t.kind != "EOF"]
        self.assertEqual(kinds, ["LPAREN", "RPAREN", "LBRACE", "RBRACE",
                                  "LBRACKET", "RBRACKET", "COMMA", "COLON", "ARROW"])
