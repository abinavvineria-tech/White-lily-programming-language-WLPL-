# White Lily Script Tutorial

> Learn programming from scratch — in a garden of code.

Welcome, new gardener. This tutorial will teach you programming using **White Lily Script**, a gentle language inspired by nature. No experience needed.

---

## 1. Your First Bloom

Every program starts with a `bloom` — a variable. Think of it as a labelled jar where you store things.

```
bloom name = "Lily"
bloom age = 7
```

- `bloom` creates a variable
- `=` assigns a value
- `"Lily"` is text (a *string*)
- `7` is a number

To see what's inside, use `blossom` (which means *print*):

```
blossom name
blossom age
```

---

## 2. Blossom — Saying Hello

```
blossom "Hello, World!"
```

`blossom` displays things on screen. You can blossom text or numbers:

```
blossom "I have " .. 3 .. " flowers"
```

The `..` operator glues things together (*concatenation*).

---

## 3. Numbers & Math

White Lily Script understands math:

```
bloom petals = 5
bloom leaves = 3
bloom total = petals + leaves
blossom total
```

Operators: `+` `-` `*` `/` `%`

---

## 4. Dew — Ask the Gardener

`dew` reads what the user types (like `input()` in Python):

```
bloom name = dew("What is your name? ")
blossom "Nice to meet you, " .. name
```

---

## 5. If — Decisions in the Garden

Use `if`, `elif`, and `else` to make decisions:

```
bloom age = dew("How old are you? ")

if age < 5:
  blossom "You are a tiny sprout!"
elif age < 18:
  blossom "You are a growing stem!"
else:
  blossom "You are a blooming flower!"
```

Notice the colon `:` at the end of the condition, and the indented block underneath.

---

## 6. Vine — Repeating (Loops)

`vine` loops over a list (like `for` in Python):

```
vine i in range(5):
  blossom "Flower number " .. i
```

`range(5)` produces `[0, 1, 2, 3, 4]`.

You can also loop over a list:

```
bloom things = ["petal", "stem", "leaf"]
vine thing in things:
  blossom thing
```

---

## 7. Flower — Your Own Commands (Functions)

A `flower` is a reusable block of code (like `def` in Python):

```
flower greet(name):
  blossom "Hello, " .. name .. "!"

garden:
  greet("Lily")
  greet("Rose")
```

- `flower define` — creates a function
- `petal` — returns a value (like `return`)
- `garden:` — the main entry point (like `if __name__ == "__main__"`)

Example with `petal`:

```
flower add(a, b):
  petal a + b

bloom result = add(10, 5)
blossom result
```

---

## 8. Petal — Returning Values

`petal` sends a value back from a function:

```
flower square(n):
  petal n * n

blossom square(4)
```

Without `petal`, a function returns `none`.

---

## 9. Garden — Where It All Starts

The `garden` block is your program's starting point:

```
flower water(plant):
  blossom "Watering " .. plant

garden:
  water("rose")
  water("lily")
```

Code inside `garden` runs first when you execute the file.

---

## 10. Types of Things

Every value has a *type*. Use `type()` to check:

```
blossom type("hello")   # lily (string)
blossom type(42)        # crystal (number)
blossom type(true)      # bloom (boolean)
blossom type([1, 2])    # garden (list)
```

| Keyword | Meaning | Examples |
|---------|---------|----------|
| `lily` | Text | `"hello"`, `'world'` |
| `crystal` | Number | `42`, `3.14` |
| `bloom` | Boolean | `true`, `false` |
| `garden` | List | `[1, 2, 3]` |
| — | Nothing | `none` |

---

## 11. Lists (Gardens)

A list stores multiple items:

```
bloom fruits = ["lily", "rose", "tulip"]
blossom fruits[0]   # lily (indexing starts at 0)
blossom len(fruits) # 3
```

---

## 12. Built-in Helpers

| Function | What it does |
|----------|-------------|
| `len(x)` | Length of string or list |
| `range(n)` | List of numbers 0 to n-1 |
| `type(x)` | Type name |
| `int(x)` | Convert to integer |
| `str(x)` | Convert to string |
| `float(x)` | Convert to decimal |
| `sleep(s)` | Pause for s seconds |
| `randint(a, b)` | Random integer between a and b |
| `sqrt(x)` | Square root |

---

## 13. Putting It All Together

A complete program:

```
# guess.wlily — Guess the number
bloom secret = randint(1, 10)
bloom guesses = 0

garden:
  blossom "~ Guess the number (1-10) ~"

  vine attempts in range(3):
    bloom guess = int(dew("Your guess: "))
    guesses = guesses + 1

    if guess == secret:
      blossom "Correct! ✿"
      petal
    elif guess < secret:
      blossom "Too low. Try again."
    else:
      blossom "Too high. Try again."

  blossom "The number was " .. secret
  blossom "You took " .. guesses .. " guesses."
```

---

## 14. Comments

Use `#` to write notes that the computer ignores:

```
# This is a comment
bloom x = 1  # inline comment
```

---

## 15. Errors Are Flowers, Too

Don't panic when you see an error:

| Prefix | Meaning |
|--------|---------|
| `🌿` | Something's wrong with the words (lexer) |
| `🌸` | Something's wrong with the sentence structure (parser) |
| `❀` | Something went wrong while running (runtime) |

Read the message, find the line number, and fix the typo. Every gardener makes mistakes.

---

## What Next?

- Write a `.wlily` file and run it with `python -m whitescript path/to/file.wlily`
- Try the REPL: `python -m whitescript`
- Read the full [Specification](SPECIFICATION.md)
- Create your own garden

## A Note from the Ancient Heroes

White Lily won't walk this garden alone.
Her dearest friends walk beside her:

- **PureVanilla** — gentle wisdom
- **DarkCacao** — quiet strength
- **Hollyberry** — warm laughter
- **GoldenCheese** — radiant joy

In White Lily Script, their names are sacred keywords — they glow like old friends in your editor, a reminder that every garden blooms brighter together.

✿

Happy blooming! 🌸
