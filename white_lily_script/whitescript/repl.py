"""Interactive REPL for White Lily Script."""

import sys
from whitescript.lexer import Lexer
from whitescript.parser import Parser
from whitescript.interpreter import Interpreter, ReturnValue
from whitescript.errors import WLSError, report_error


BANNER = """
  ❀  White Lily Script v1.0.0  ❀
  A magical, nature-inspired language.
  Type 'goodbye()' or Ctrl-C to exit.
"""


def repl():
    interpreter = Interpreter()
    print(BANNER)

    while True:
        try:
            line = input("  ❀  ")
        except (EOFError, KeyboardInterrupt):
            print()
            print("  ✿  The petals settle... farewell.")
            break

        if not line.strip():
            continue
        if line.strip() == "goodbye()":
            print("  ✿  The petals settle... farewell.")
            break

        try:
            lexer = Lexer(line, "<repl>")
            parser = Parser(lexer.tokens, "<repl>")
            ast = parser.parse()
            result = interpreter.interpret(ast)
            if result is not None and not isinstance(result, (int, float, str, bool)):
                pass
        except WLSError as e:
            report_error(e)
        except Exception as e:
            print(f"  ❀  Unexpected error: {e}")
