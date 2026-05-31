"""Command-line interface for White Lily Script."""

import argparse
import sys
import os

from whitescript import __version__
from whitescript.lexer import Lexer
from whitescript.parser import Parser
from whitescript.interpreter import Interpreter
from whitescript.repl import repl
from whitescript.errors import WLSError, report_error, LexerError, ParserError


def run_file(path):
    with open(path, "r", encoding="utf-8") as f:
        source = f.read()

    try:
        lexer = Lexer(source, path)
    except LexerError as e:
        report_error(e)
        sys.exit(1)

    try:
        parser = Parser(lexer.tokens, path)
        ast = parser.parse()
    except ParserError as e:
        report_error(e)
        sys.exit(1)

    try:
        interpreter = Interpreter()
        interpreter.interpret(ast)
    except WLSError as e:
        report_error(e)
        sys.exit(1)


def run_tokens(source, path="<stdin>"):
    lexer = Lexer(source, path)
    for tok in lexer.tokens:
        print(tok)


def run_ast(source, path="<stdin>"):
    lexer = Lexer(source, path)
    parser = Parser(lexer.tokens, path)
    ast = parser.parse()
    print_ast(ast)


def print_ast(node, indent=0):
    prefix = "  " * indent
    if isinstance(node, list):
        for item in node:
            print_ast(item, indent)
        return
    print(f"{prefix}{type(node).__name__}", end="")
    if hasattr(node, "value") and not isinstance(node, (list,)):
        print(f"({node.value})", end="")
    if hasattr(node, "name"):
        print(f"({node.name})", end="")
    if hasattr(node, "op"):
        print(f" [{node.op}]", end="")
    print()
    for attr in dir(node):
        if attr.startswith("_"):
            continue
        val = getattr(node, attr)
        if callable(val):
            continue
        if isinstance(val, Node):
            print_ast(val, indent + 1)
        elif isinstance(val, list):
            for item in val:
                if isinstance(item, Node):
                    print_ast(item, indent + 1)
        elif val and attr not in ("line", "col", "name", "value", "op"):
            print(f"{prefix}  {attr}: {val}")


def main(argv=None):
    parser = argparse.ArgumentParser(
        prog="whitescript",
        description="White Lily Script - a magical, nature-inspired programming language",
    )
    parser.add_argument("file", nargs="?", help="Path to a .wlily file")
    parser.add_argument("--tokens", action="store_true", help="Show token stream")
    parser.add_argument("--ast", action="store_true", help="Show AST")
    parser.add_argument("--version", "-v", action="version",
                        version=f"White Lily Script v{__version__}")

    args = parser.parse_args(argv)

    if args.file:
        if not os.path.exists(args.file):
            print(f"  ❀  File not found: {args.file}")
            sys.exit(1)
        with open(args.file, "r", encoding="utf-8") as f:
            source = f.read()
        if args.tokens:
            run_tokens(source, args.file)
        elif args.ast:
            run_ast(source, args.file)
        else:
            run_file(args.file)
    else:
        repl()
