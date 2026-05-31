# White Lily Script Language Specification

> Version 1.0.0 — A magical, nature-inspired programming language.

## File Extension

`.wlily`

## Overview

White Lily Script is a dynamically-typed, interpreted programming language with Python-like syntax and flower-themed keywords. It is designed to feel elegant, magical, and connected to nature.

## Keywords

| Keyword | Purpose | Python Equivalent |
|---------|---------|-------------------|
| `bloom` | Variable declaration | `let` / `var` |
| `flower` | Function declaration | `def` |
| `blossom` | Print/output | `print` |
| `garden` | Main entry point | `if __name__ == "__main__"` |
| `petal` | Return from function | `return` |
| `vine` | Loop over iterable | `for` |
| `dew` | Read user input | `input` |
| `if` / `elif` / `else` | Conditionals | `if` / `elif` / `else` |
| `and` / `or` / `not` | Logical operators | `and` / `or` / `not` |
| `true` / `false` | Booleans | `True` / `False` |
| `none` | Null value | `None` |

## Data Types

| Type | Keyword | Examples |
|------|---------|---------|
| String | `lily` | `"hello"`, `'world'` |
| Number | `crystal` | `42`, `3.14` |
| Boolean | `bloom` | `true`, `false` |
| List | `garden` | `[1, 2, 3]` |
| None | — | `none` |

## Variables

Use `bloom` to declare a variable:

```
bloom name = "White Lily"
bloom count = 42
bloom items = [1, 2, 3]
```

Variables can be reassigned without `bloom`:

```
count = 100
```

## Functions

Declare with `flower`, return with `petal`:

```
flower add(a, b):
  petal a + b
```

## Conditionals

```
if x > 0:
  blossom "positive"
elif x < 0:
  blossom "negative"
else:
  blossom "zero"
```

## Loops

Use `vine` to iterate:

```
vine i in range(10):
  blossom i
```

## Input

```
bloom name = dew("Enter your name: ")
```

## Output

```
blossom "Hello, World!"
blossom 42
blossom x + y
```

## The Garden

The `garden` block is the main entry point:

```
flower hello():
  blossom "Hello!"

garden:
  hello()
```

## Built-in Functions

| Function | Description |
|----------|-------------|
| `len(x)` | Length of string or list |
| `range(n)` | Generate list of numbers |
| `type(x)` | Type name as string |
| `int(x)` | Convert to integer |
| `str(x)` | Convert to string |
| `float(x)` | Convert to float |
| `sleep(s)` | Sleep for seconds |
| `randint(a, b)` | Random integer between a and b |
| `sqrt(x)` | Square root |

## Operators

### Arithmetic
- `+` Addition / string concatenation
- `-` Subtraction / negation
- `*` Multiplication
- `/` Division
- `%` Modulo
- `..` String concatenation (alternative)

### Comparison
- `==` Equal
- `!=` Not equal
- `<` Less than
- `>` Greater than
- `<=` Less than or equal
- `>=` Greater than or equal

### Logical
- `and` Logical AND
- `or` Logical OR
- `not` Logical NOT

## Comments

```
# This is a comment
bloom x = 1 # inline comment
```

## Grammar (EBNF)

```
program        = { statement }
statement      = bloom_assign | flower_def | blossom | garden
               | return | vine | if | assign | call | block
bloom_assign   = "bloom" IDENT [ ":" type ] [ "=" expression ]
flower_def     = "flower" IDENT "(" [ params ] ")" ":" block
blossom        = "blossom" expression
return         = "petal" [ expression ]
vine           = "vine" IDENT "=" expression ":" block
if             = "if" expression ":" block { "elif" expression ":" block } [ "else" ":" block ]
garden         = "garden" ":" block
block          = "{" { statement } "}" | statement
expression     = logical_or
logical_or     = logical_and { "or" logical_and }
logical_and    = equality { "and" equality }
equality       = comparison { ("==" | "!=") comparison }
comparison     = term { ("<" | ">" | "<=" | ">=") term }
term           = factor { ("+" | "-") factor }
factor         = unary { ("*" | "/" | "%") unary }
unary          = ["-" | "not"] primary
primary        = NUMBER | STRING | "true" | "false" | "none"
               | IDENT [ "(" [ args ] ")" ]
               | "(" expression ")"
               | "[" [ args ] "]"
               | "dew" "(" [ expression ] ")"
```

## Error Messages

All errors are themed:

- **Lexer Error** — `🌿` prefix
- **Parser Error** — `🌸` prefix
- **Runtime Error** — `❀` prefix

Errors include line numbers and descriptive messages.
