"""Error handling for White Lily Script."""

import sys


class WLSError(Exception):
    """Base error for White Lily Script."""

    def __init__(self, message, line=None, col=None, source=""):
        self.line = line
        self.col = col
        self.source = source
        msg = self._format(message)
        super().__init__(msg)

    def _format(self, message):
        parts = []
        if self.source:
            parts.append(f"[{self.source}]")
        parts.append("✿ Error")
        if self.line is not None:
            parts.append(f"at line {self.line}")
            if self.col is not None:
                parts.append(f"column {self.col}")
        parts.append("—")
        parts.append(message)
        return " ".join(parts)


class LexerError(WLSError):
    """Error during lexing/tokenization."""

    def _format(self, message):
        return f"  🌿 Lexer Error  — {message}"


class ParserError(WLSError):
    """Error during parsing."""

    def _format(self, message):
        loc = ""
        if self.line is not None:
            loc = f" around line {self.line}"
        return f"  🌸 Parser Error{loc} — {message}"


class RuntimeError_(WLSError):
    """Error during interpretation."""

    def _format(self, message):
        loc = ""
        if self.line is not None:
            loc = f" at line {self.line}"
        return f"  ❀ Runtime Error{loc} — {message}"


def report_error(error, show_traceback=False):
    """Print a formatted error message."""
    print(str(error), file=sys.stderr)
    if show_traceback:
        import traceback
        traceback.print_exc()
