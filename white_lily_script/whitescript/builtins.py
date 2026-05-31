"""Built-in functions for White Lily Script."""

import time
import random
import math


def wls_len(arg):
    if isinstance(arg, list):
        return len(arg)
    if isinstance(arg, str):
        return len(arg)
    return 0


def wls_range(*args):
    return list(range(*[int(a) for a in args]))


def wls_type(arg):
    t = type(arg).__name__
    mapping = {
        "str": "lily",
        "int": "crystal",
        "float": "crystal",
        "bool": "bloom",
        "list": "garden",
        "NoneType": "none",
    }
    return mapping.get(t, t)


def wls_int(arg):
    return int(arg)


def wls_str(arg):
    return str(arg)


def wls_float(arg):
    return float(arg)


def wls_sleep(seconds):
    time.sleep(seconds)


def wls_randint(a, b):
    return random.randint(int(a), int(b))


def wls_sqrt(x):
    return math.sqrt(x)


BUILTINS = {
    "len": wls_len,
    "range": wls_range,
    "type": wls_type,
    "int": wls_int,
    "str": wls_str,
    "float": wls_float,
    "sleep": wls_sleep,
    "randint": wls_randint,
    "sqrt": wls_sqrt,
}
