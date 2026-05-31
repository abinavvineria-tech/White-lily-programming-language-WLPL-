"""Parser for White Lily Script. Converts tokens to AST."""

from whitescript.ast import *
from whitescript.errors import ParserError
from whitescript.lexer import Lexer


class Parser:
    def __init__(self, tokens, filename="<stdin>"):
        self.tokens = tokens
        self.filename = filename
        self.pos = 0
        self.functions = {}

    def _error(self, msg, token=None):
        tk = token or self._peek()
        raise ParserError(msg, line=tk.line, col=tk.col, source=self.filename)

    def _peek(self, offset=0):
        i = self.pos + offset
        return self.tokens[i] if i < len(self.tokens) else self.tokens[-1]

    def _previous(self):
        return self.tokens[self.pos - 1] if self.pos > 0 else self.tokens[0]

    def _advance(self):
        tk = self.tokens[self.pos]
        self.pos += 1
        return tk

    def _check(self, kind):
        return self._peek().kind == kind

    def _match(self, *kinds):
        for kind in kinds:
            if self._check(kind):
                return self._advance()
        return None

    def _expect(self, kind, msg=None):
        if self._check(kind):
            return self._advance()
        tk = self._peek()
        self._error(msg or f"Expected {kind}, got {tk.kind} ({tk.value})", tk)

    def _skip_newlines(self):
        while self._check("NEWLINE"):
            self._advance()

    def parse(self):
        statements = []
        self._skip_newlines()
        while not self._check("EOF"):
            stmt = self._statement()
            if stmt:
                statements.append(stmt)
            self._skip_newlines()
        return Program(statements)

    def _statement(self):
        if self._match("COMMENT"):
            self._skip_newlines()
            return None
        if self._check("BLOOM"):
            return self._bloom_assign()
        if self._check("FLOWER"):
            return self._function_def()
        if self._check("BLOSSOM"):
            return self._blossom()
        if self._check("GARDEN"):
            return self._garden()
        if self._check("PETAL"):
            return self._return()
        if self._check("VINE"):
            return self._vine()
        if self._check("IF"):
            return self._if()
        if self._check("NEWLINE"):
            self._advance()
            return None
        if self._check_ident():
            return self._assign_or_call()
        if self._check("LBRACE"):
            return self._block()
        tk = self._peek()
        self._error(f"Unexpected {tk.kind}: {tk.value}", tk)

    IDENT_TOKENS = {
        "IDENT",
        "LILY", "CRYSTAL", "GARDEN", "BLOOM_TYPE",
        "FLOWER", "BLOOM", "BLOSSOM", "PETAL", "VINE", "DEW",
        "IF", "ELIF", "ELSE", "TRUE", "FALSE", "NONE",
        "AND", "OR", "NOT", "IN",
    }

    def _check_ident(self):
        return self._peek().kind in self.IDENT_TOKENS

    def _expect_ident(self, msg=None):
        if self._peek().kind in self.IDENT_TOKENS:
            return self._advance()
        self._error(msg or f"Expected identifier, got {self._peek().kind}")

    def _bloom_assign(self):
        kw = self._advance()
        name_tk = self._expect_ident("Expected variable name after 'bloom'")
        type_hint = None
        if self._match("COLON"):
            type_tk = self._advance()
            type_hint = type_tk.value
        if self._match("ASSIGN"):
            value = self._expression()
        else:
            value = NoneLiteral()
        self._skip_newlines()
        return BloomAssign(name_tk.value, value, type_hint, line=kw.line, col=kw.col)

    def _function_def(self):
        kw = self._advance()
        name_tk = self._expect_ident("Expected function name after 'flower'")
        self._expect("LPAREN", "Expected '(' after function name")
        params = []
        if not self._check("RPAREN"):
            params.append(self._expect_ident().value)
            while self._match("COMMA"):
                params.append(self._expect_ident().value)
        self._expect("RPAREN", "Expected ')' after parameters")
        self._expect("COLON", "Expected ':' after function signature")
        self._skip_newlines()
        block = self._block(parent_col=kw.col)
        return FunctionDef(name_tk.value, params, block, line=kw.line, col=kw.col)

    def _blossom(self):
        kw = self._advance()
        expr = self._expression()
        return Blossom(expr, line=kw.line, col=kw.col)

    def _garden(self):
        kw = self._advance()
        self._expect("COLON", "Expected ':' after 'garden'")
        self._skip_newlines()
        block = self._block(parent_col=kw.col)
        return Garden(block, line=kw.line, col=kw.col)

    def _return(self):
        kw = self._advance()
        if self._check("NEWLINE") or self._check("EOF") or self._check("RBRACE"):
            return Return(None, line=kw.line, col=kw.col)
        expr = self._expression()
        return Return(expr, line=kw.line, col=kw.col)

    def _vine(self):
        kw = self._advance()
        ident = self._expect_ident("Expected variable name after 'vine'")
        if self._match("IN"):
            pass
        elif self._match("ASSIGN"):
            pass
        else:
            self._error("Expected 'in' or '=' after variable in vine loop")
        iterable = self._expression()
        self._expect("COLON", "Expected ':' after vine header")
        self._skip_newlines()
        block = self._block(parent_col=kw.col)
        return Vine(ident.value, iterable, block, line=kw.line, col=kw.col)

    def _if(self):
        kw = self._advance()
        condition = self._expression()
        self._expect("COLON", "Expected ':' after condition")
        self._skip_newlines()
        then_block = self._block(parent_col=kw.col)
        elifs = []
        else_block = None
        self._skip_newlines()
        while self._check("ELIF"):
            el_kw = self._advance()
            el_cond = self._expression()
            self._expect("COLON")
            self._skip_newlines()
            el_block = self._block(parent_col=el_kw.col)
            elifs.append(Elif(el_cond, el_block, line=el_kw.line, col=el_kw.col))
            self._skip_newlines()
        if self._check("ELSE"):
            el_kw = self._advance()
            self._expect("COLON")
            self._skip_newlines()
            else_block = self._block(parent_col=el_kw.col)
        return If(condition, then_block, elifs, else_block, line=kw.line, col=kw.col)

    BLOCK_END = {"EOF", "RBRACE", "FLOWER", "GARDEN", "BLOOM"}

    BLOCK_END = {"EOF", "RBRACE", "FLOWER", "GARDEN", "BLOOM"}

    def _block(self, parent_col=0):
        self._skip_newlines()
        if self._check("LBRACE"):
            self._advance()
            self._skip_newlines()
            stmts = []
            while not self._check("RBRACE") and not self._check("EOF"):
                stmt = self._statement()
                if stmt:
                    stmts.append(stmt)
                self._skip_newlines()
            self._expect("RBRACE", "Expected '}' to close block")
            return Block(stmts)
        stmts = []
        while not self._peek().kind in self.BLOCK_END:
            if stmts and self._peek().col <= parent_col:
                break
            stmt = self._statement()
            if stmt:
                stmts.append(stmt)
            self._skip_newlines()
        return Block(stmts) if stmts else Block([])

    def _assign_or_call(self):
        tk = self._advance()
        name = tk.value
        if self._match("ASSIGN"):
            value = self._expression()
            return Assign(name, value, line=tk.line, col=tk.col)
        if self._check("LPAREN"):
            return self._finish_call(name, tk)
        self._error(f"Expected '=' or '(' after identifier '{name}'", tk)

    def _finish_call(self, name, tk):
        self._advance()
        args = []
        if not self._check("RPAREN"):
            args.append(self._expression())
            while self._match("COMMA"):
                args.append(self._expression())
        self._expect("RPAREN", "Expected ')' after arguments")
        return Call(Identifier(name, line=tk.line, col=tk.col), args, line=tk.line, col=tk.col)

    def _expression(self):
        return self._logical_or()

    def _logical_or(self):
        left = self._logical_and()
        while self._match("OR"):
            op = self._previous().value
            right = self._logical_and()
            left = BinaryOp(left, op, right)
        return left

    def _logical_and(self):
        left = self._equality()
        while self._match("AND"):
            op = self._previous().value
            right = self._equality()
            left = BinaryOp(left, op, right)
        return left

    def _equality(self):
        left = self._comparison()
        while self._match("EQ", "NEQ"):
            op = self._previous().value
            right = self._comparison()
            left = BinaryOp(left, op, right)
        return left

    def _comparison(self):
        left = self._term()
        while self._match("LT", "GT", "LTE", "GTE"):
            op = self._previous().value
            right = self._term()
            left = BinaryOp(left, op, right)
        return left

    def _term(self):
        left = self._factor()
        while self._match("PLUS", "MINUS", "CONCAT"):
            op = self._previous().value
            right = self._factor()
            left = BinaryOp(left, op, right)
        return left

    def _factor(self):
        left = self._unary()
        while self._match("STAR", "SLASH", "MOD"):
            op = self._previous().value
            right = self._unary()
            left = BinaryOp(left, op, right)
        return left

    def _unary(self):
        if self._match("MINUS"):
            op = self._previous().value
            operand = self._unary()
            return UnaryOp(op, operand)
        if self._match("NOT"):
            op = self._previous().value
            operand = self._unary()
            return UnaryOp(op, operand)
        return self._primary()

    def _primary(self):
        tk = self._advance()
        if tk.kind == "NUMBER":
            val = float(tk.value) if "." in tk.value else int(tk.value)
            return Number(val, line=tk.line, col=tk.col)
        if tk.kind == "STRING":
            return String(tk.value[1:-1], line=tk.line, col=tk.col)
        if tk.kind == "TRUE":
            return Boolean(True, line=tk.line, col=tk.col)
        if tk.kind == "FALSE":
            return Boolean(False, line=tk.line, col=tk.col)
        if tk.kind == "NONE":
            return NoneLiteral()
        if tk.kind in self.IDENT_TOKENS:
            if self._check("LPAREN"):
                return self._finish_call(tk.value, tk)
            return Identifier(tk.value, line=tk.line, col=tk.col)
        if tk.kind == "DEW":
            if self._check("LPAREN"):
                self._advance()
                prompt = ""
                if not self._check("RPAREN"):
                    p_node = self._expression()
                    if isinstance(p_node, String):
                        prompt = p_node.value
                self._expect("RPAREN")
            return Dew(prompt, line=tk.line, col=tk.col)
        if tk.kind == "LBRACKET":
            elements = []
            if not self._check("RBRACKET"):
                elements.append(self._expression())
                while self._match("COMMA"):
                    elements.append(self._expression())
            self._expect("RBRACKET", "Expected ']'")
            return List_(elements, line=tk.line, col=tk.col)
        if tk.kind == "MINUS":
            return UnaryOp("-", self._primary())
        if tk.kind == "NOT":
            return UnaryOp("not", self._primary())
        if tk.kind == "LPAREN":
            expr = self._expression()
            self._expect("RPAREN", "Expected ')'")
            return expr
        if tk.kind in ("NEWLINE", "EOF"):
            return None
        self._error(f"Unexpected token: {tk.kind} ({tk.value})", tk)
