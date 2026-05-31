"""Tests for the White Lily Script interpreter."""

import unittest
from io import StringIO
import sys

from whitescript.lexer import Lexer
from whitescript.parser import Parser
from whitescript.interpreter import Interpreter, ReturnValue
from whitescript.ast import *


class TestInterpreter(unittest.TestCase):
    def _run(self, source):
        lexer = Lexer(source, "<test>")
        parser = Parser(lexer.tokens, "<test>")
        ast = parser.parse()
        interpreter = Interpreter()
        return interpreter.interpret(ast)

    def test_number(self):
        result = self._run("bloom x = 42")
        self.assertEqual(result, 42)

    def test_string(self):
        result = self._run('bloom x = "hello"')
        self.assertEqual(result, "hello")

    def test_addition(self):
        result = self._run("bloom x = 1 + 2")
        self.assertEqual(result, 3)

    def test_subtraction(self):
        result = self._run("bloom x = 10 - 3")
        self.assertEqual(result, 7)

    def test_multiplication(self):
        result = self._run("bloom x = 4 * 5")
        self.assertEqual(result, 20)

    def test_division(self):
        result = self._run("bloom x = 10 / 3")
        self.assertAlmostEqual(result, 3.3333333)

    def test_comparison(self):
        result = self._run("bloom x = 1 < 2")
        self.assertTrue(result)

    def test_boolean_and(self):
        result = self._run("bloom x = true and false")
        self.assertFalse(result)

    def test_boolean_or(self):
        result = self._run("bloom x = true or false")
        self.assertTrue(result)

    def test_not(self):
        result = self._run("bloom x = not true")
        self.assertFalse(result)

    def test_unary_minus(self):
        result = self._run("bloom x = -5")
        self.assertEqual(result, -5)

    def test_reassign(self):
        self._run("bloom x = 1")
        result = self._run("x = 42")
        self.assertEqual(result, 42)

    def test_function_call(self):
        source = """
flower add(a, b):
  petal a + b
bloom result = add(3, 4)
"""
        result = self._run(source)
        self.assertEqual(result, 7)

    def test_recursive_function(self):
        source = """
flower fact(n):
  if n <= 1:
    petal 1
  petal n * fact(n - 1)

bloom result = fact(5)
"""
        result = self._run(source)
        self.assertEqual(result, 120)

    def test_if_true(self):
        source = """
bloom x = 0
if true:
  x = 42
"""
        result = self._run(source)
        self.assertEqual(result, 42)

    def test_if_false(self):
        source = """
bloom x = 0
if false:
  x = 42
else:
  x = 99
"""
        result = self._run(source)
        self.assertEqual(result, 99)

    def test_vine(self):
        source = """
bloom total = 0
vine i in range(5):
  total = total + i
"""
        result = self._run(source)
        self.assertEqual(result, 10)

    def test_list(self):
        result = self._run("bloom x = [1, 2, 3]")
        self.assertEqual(result, [1, 2, 3])

    def test_len_builtin(self):
        result = self._run('bloom x = len("hello")')
        self.assertEqual(result, 5)

    def test_range_builtin(self):
        result = self._run("bloom x = range(5)")
        self.assertEqual(result, [0, 1, 2, 3, 4])

    def test_garden_block(self):
        source = """
garden:
  bloom msg = "hello from garden"
"""
        result = self._run(source)
        self.assertEqual(result, "hello from garden")

    def test_string_concat(self):
        result = self._run('bloom x = "hello" .. " world"')
        self.assertEqual(result, "hello world")

    def test_type_check(self):
        result = self._run('bloom t = type("test")')
        self.assertEqual(result, "lily")

    def test_return_value(self):
        source = """
flower get_val():
  petal 99
bloom result = get_val()
"""
        result = self._run(source)
        self.assertEqual(result, 99)
