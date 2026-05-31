"""AST node definitions for White Lily Script."""


class Node:
    def __init__(self, line=None, col=None):
        self.line = line
        self.col = col

    def __repr__(self):
        return f"{self.__class__.__name__}()"


class Program(Node):
    def __init__(self, statements):
        super().__init__()
        self.statements = statements

    def __repr__(self):
        return f"Program({len(self.statements)} stmts)"


class Number(Node):
    def __init__(self, value, line=None, col=None):
        super().__init__(line, col)
        self.value = value

    def __repr__(self):
        return f"Number({self.value})"


class String(Node):
    def __init__(self, value, line=None, col=None):
        super().__init__(line, col)
        self.value = value

    def __repr__(self):
        return f"String({self.value!r})"


class Boolean(Node):
    def __init__(self, value, line=None, col=None):
        super().__init__(line, col)
        self.value = value

    def __repr__(self):
        return f"Boolean({self.value})"


class NoneLiteral(Node):
    def __repr__(self):
        return "NoneLiteral"


class Identifier(Node):
    def __init__(self, name, line=None, col=None):
        super().__init__(line, col)
        self.name = name

    def __repr__(self):
        return f"Identifier({self.name})"


class BinaryOp(Node):
    def __init__(self, left, op, right, line=None, col=None):
        super().__init__(line, col)
        self.left = left
        self.op = op
        self.right = right

    def __repr__(self):
        return f"BinaryOp({self.left} {self.op} {self.right})"


class UnaryOp(Node):
    def __init__(self, op, operand, line=None, col=None):
        super().__init__(line, col)
        self.op = op
        self.operand = operand

    def __repr__(self):
        return f"UnaryOp({self.op} {self.operand})"


class Assign(Node):
    def __init__(self, name, value, line=None, col=None):
        super().__init__(line, col)
        self.name = name
        self.value = value

    def __repr__(self):
        return f"Assign({self.name} = {self.value})"


class BloomAssign(Node):
    def __init__(self, name, value, type_hint=None, line=None, col=None):
        super().__init__(line, col)
        self.name = name
        self.value = value
        self.type_hint = type_hint

    def __repr__(self):
        return f"BloomAssign({self.name} = {self.value})"


class Blossom(Node):
    def __init__(self, expression, line=None, col=None):
        super().__init__(line, col)
        self.expression = expression

    def __repr__(self):
        return f"Blossom({self.expression})"


class Block(Node):
    def __init__(self, statements, line=None, col=None):
        super().__init__(line, col)
        self.statements = statements

    def __repr__(self):
        return f"Block({len(self.statements)} stmts)"


class If(Node):
    def __init__(self, condition, then_block, elifs=None, else_block=None, line=None, col=None):
        super().__init__(line, col)
        self.condition = condition
        self.then_block = then_block
        self.elifs = elifs or []
        self.else_block = else_block

    def __repr__(self):
        return f"If({self.condition})"


class Elif(Node):
    def __init__(self, condition, block, line=None, col=None):
        super().__init__(line, col)
        self.condition = condition
        self.block = block


class Vine(Node):
    def __init__(self, identifier, iterable, block, line=None, col=None):
        super().__init__(line, col)
        self.identifier = identifier
        self.iterable = iterable
        self.block = block

    def __repr__(self):
        return f"Vine({self.identifier} in {self.iterable})"


class FunctionDef(Node):
    def __init__(self, name, params, block, line=None, col=None):
        super().__init__(line, col)
        self.name = name
        self.params = params
        self.block = block

    def __repr__(self):
        return f"FunctionDef({self.name}({self.params}))"


class Return(Node):
    def __init__(self, expression=None, line=None, col=None):
        super().__init__(line, col)
        self.expression = expression

    def __repr__(self):
        return f"Return({self.expression})"


class Call(Node):
    def __init__(self, function, arguments, line=None, col=None):
        super().__init__(line, col)
        self.function = function
        self.arguments = arguments

    def __repr__(self):
        return f"Call({self.function})"


class Dew(Node):
    def __init__(self, prompt="", line=None, col=None):
        super().__init__(line, col)
        self.prompt = prompt

    def __repr__(self):
        return f"Dew({self.prompt!r})"


class Garden(Node):
    def __init__(self, block, line=None, col=None):
        super().__init__(line, col)
        self.block = block

    def __repr__(self):
        return "Garden()"


class List_(Node):
    def __init__(self, elements, line=None, col=None):
        super().__init__(line, col)
        self.elements = elements

    def __repr__(self):
        return f"List({len(self.elements)} elements)"
