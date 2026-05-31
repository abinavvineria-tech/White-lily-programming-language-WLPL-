"""Interpreter for White Lily Script."""

from whitescript.ast import *
from whitescript.errors import RuntimeError_
from whitescript.builtins import BUILTINS


class Environment:
    def __init__(self, parent=None):
        self.vars = {}
        self.parent = parent

    def get(self, name):
        if name in self.vars:
            return self.vars[name]
        if self.parent:
            return self.parent.get(name)
        raise RuntimeError_(f"'{name}' is not blooming in this garden")

    def set(self, name, value):
        if name in self.vars:
            self.vars[name] = value
        elif self.parent:
            self.parent.set(name, value)
        else:
            self.vars[name] = value

    def define(self, name, value):
        self.vars[name] = value


class ReturnValue(Exception):
    def __init__(self, value):
        self.value = value


class Interpreter:
    def __init__(self):
        self.globals = Environment()
        for name, fn in BUILTINS.items():
            self.globals.define(name, fn)

    def interpret(self, node):
        return self._visit(node)

    def _visit(self, node):
        if node is None:
            return None
        method = f"_visit_{type(node).__name__}"
        visitor = getattr(self, method, None)
        if not visitor:
            raise RuntimeError_(f"No visitor for {type(node).__name__}")
        return visitor(node)

    def _visit_Program(self, node):
        result = None
        for stmt in node.statements:
            result = self._visit(stmt)
        return result

    def _visit_Number(self, node):
        return node.value

    def _visit_String(self, node):
        return node.value

    def _visit_Boolean(self, node):
        return node.value

    def _visit_NoneLiteral(self, node):
        return None

    def _visit_Identifier(self, node):
        return self.globals.get(node.name)

    def _visit_BinaryOp(self, node):
        left = self._visit(node.left)
        right = self._visit(node.right)
        op = node.op
        if op == "+":
            if isinstance(left, (int, float)) and isinstance(right, (int, float)):
                return left + right
            return str(left) + str(right)
        elif op == "-":
            return left - right
        elif op == "*":
            return left * right
        elif op == "/":
            if right == 0:
                raise RuntimeError_("Cannot divide by zero", line=node.line)
            return left / right
        elif op == "%":
            return left % right
        elif op == "==":
            return left == right
        elif op == "!=":
            return left != right
        elif op == "<":
            return left < right
        elif op == ">":
            return left > right
        elif op == "<=":
            return left <= right
        elif op == ">=":
            return left >= right
        elif op == "..":
            return str(left) + str(right)
        elif op == "and":
            return left and right
        elif op == "or":
            return left or right
        raise RuntimeError_(f"Unknown operator: {op}", line=node.line)

    def _visit_UnaryOp(self, node):
        operand = self._visit(node.operand)
        if node.op == "-":
            return -operand
        elif node.op == "not":
            return not operand
        return operand

    def _visit_BloomAssign(self, node):
        value = self._visit(node.value) if node.value else None
        self.globals.define(node.name, value)
        return value

    def _visit_Assign(self, node):
        value = self._visit(node.value)
        self.globals.set(node.name, value)
        return value

    def _visit_Blossom(self, node):
        value = self._visit(node.expression)
        if value is None:
            print("none")
        elif isinstance(value, bool):
            print("true" if value else "false")
        else:
            print(value)
        return value

    def _visit_Block(self, node):
        result = None
        for stmt in node.statements:
            result = self._visit(stmt)
        return result

    def _visit_If(self, node):
        cond = self._visit(node.condition)
        if cond:
            return self._visit(node.then_block)
        for elif_node in node.elifs:
            if self._visit(elif_node.condition):
                return self._visit(elif_node.block)
        if node.else_block:
            return self._visit(node.else_block)
        return None

    def _visit_Elif(self, node):
        return self._visit(node.condition)

    def _visit_Vine(self, node):
        iterable = self._visit(node.iterable)
        result = None
        for item in iterable:
            self.globals.define(node.identifier, item)
            try:
                result = self._visit(node.block)
            except ReturnValue as rv:
                return rv.value
        return result

    def _visit_FunctionDef(self, node):
        def fn(*args):
            env = Environment(self.globals)
            for param, arg in zip(node.params, args):
                env.define(param, arg)
            old = self.globals
            self.globals = env
            try:
                result = self._visit(node.block)
                self.globals = old
                return result
            except ReturnValue as rv:
                self.globals = old
                return rv.value
        self.globals.define(node.name, fn)
        return fn

    def _visit_Return(self, node):
        value = self._visit(node.expression) if node.expression else None
        raise ReturnValue(value)

    def _visit_Call(self, node):
        fn = self._visit(node.function)
        args = [self._visit(a) for a in node.arguments]
        if callable(fn):
            return fn(*args)
        raise RuntimeError_(f"'{node.function.name}' is not a flower function", line=node.line)

    def _visit_Dew(self, node):
        try:
            return input(node.prompt or "")
        except EOFError:
            return ""

    def _visit_Garden(self, node):
        return self._visit(node.block)

    def _visit_List_(self, node):
        return [self._visit(e) for e in node.elements]
