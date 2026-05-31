"""Tests for the White Lily Script parser."""

import unittest
from whitescript.lexer import Lexer
from whitescript.parser import Parser
from whitescript.ast import *


class TestParser(unittest.TestCase):
    def _parse(self, source):
        lexer = Lexer(source, "<test>")
        parser = Parser(lexer.tokens, "<test>")
        return parser.parse()

    def test_program_empty(self):
        ast = self._parse("")
        self.assertIsInstance(ast, Program)
        self.assertEqual(len(ast.statements), 0)

    def test_bloom_assign(self):
        ast = self._parse("bloom x = 42")
        self.assertIsInstance(ast.statements[0], BloomAssign)
        self.assertEqual(ast.statements[0].name, "x")

    def test_blossom(self):
        ast = self._parse('blossom "hello"')
        self.assertIsInstance(ast.statements[0], Blossom)
        self.assertIsInstance(ast.statements[0].expression, String)

    def test_function_def(self):
        ast = self._parse("flower add(a, b):\n  petal a + b")
        stmt = ast.statements[0]
        self.assertIsInstance(stmt, FunctionDef)
        self.assertEqual(stmt.name, "add")
        self.assertEqual(stmt.params, ["a", "b"])

    def test_if(self):
        ast = self._parse("if true:\n  blossom 1")
        stmt = ast.statements[0]
        self.assertIsInstance(stmt, If)
        self.assertIsInstance(stmt.condition, Boolean)

    def test_if_else(self):
        ast = self._parse("if x:\n  blossom 1\nelse:\n  blossom 2")
        stmt = ast.statements[0]
        self.assertIsInstance(stmt, If)
        self.assertIsNotNone(stmt.else_block)

    def test_vine(self):
        ast = self._parse("vine i in range(5):\n  blossom i")
        stmt = ast.statements[0]
        self.assertIsInstance(stmt, Vine)
        self.assertEqual(stmt.identifier, "i")

    def test_garden(self):
        ast = self._parse("garden:\n  blossom 1")
        stmt = ast.statements[0]
        self.assertIsInstance(stmt, Garden)

    def test_return(self):
        ast = self._parse("petal 42")
        stmt = ast.statements[0]
        self.assertIsInstance(stmt, Return)
        self.assertIsInstance(stmt.expression, Number)

    def test_block_with_braces(self):
        ast = self._parse("{\n  blossom 1\n  blossom 2\n}")
        stmt = ast.statements[0]
        self.assertIsInstance(stmt, Block)
        self.assertEqual(len(stmt.statements), 2)

    def test_binary_op(self):
        ast = self._parse("bloom x = 1 + 2")
        assign = ast.statements[0]
        self.assertIsInstance(assign.value, BinaryOp)
        self.assertEqual(assign.value.op, "+")

    def test_list(self):
        ast = self._parse("bloom x = [1, 2, 3]")
        assign = ast.statements[0]
        self.assertIsInstance(assign.value, List_)
        self.assertEqual(len(assign.value.elements), 3)

    def test_call(self):
        ast = self._parse("foo(1, 2)")
        stmt = ast.statements[0]
        self.assertIsInstance(stmt, Call)
        self.assertEqual(len(stmt.arguments), 2)
