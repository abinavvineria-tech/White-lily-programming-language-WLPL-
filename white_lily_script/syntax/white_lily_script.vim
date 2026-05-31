" Vim syntax file for White Lily Script (.wlily)
" Language: White Lily Script
" Maintainer: White Lily
" Filenames: *.wlily

if exists("b:current_syntax")
  finish
endif

" White Lily keywords
syn keyword wlsKeyword   bloom flower blossom garden petal vine dew
syn keyword wlsConditional if elif else
syn keyword wlsBoolean   true false
syn keyword wlsNone      none

" Python control flow keywords
syn keyword wlsControl   while for break continue pass with as
syn keyword wlsImport    import from as
syn keyword wlsException try except finally raise assert
syn keyword wlsDef       def return lambda yield
syn keyword wlsClass     class global nonlocal del
syn keyword wlsAsync     async await

" Type keywords
syn keyword wlsType      lily crystal bloom_type garden

" Self / special identifiers
syn keyword wlsSelf      self cls metaclass

" Ancient Heroes (White Lily's best friends)
syn keyword wlsHeroes    PureVanilla DarkCacao Hollyberry GoldenCheese WhiteLily

" Operators
syn keyword wlsOperator   and or not is in
syn match   wlsOperator  "[+\-*/%=<>!]"
syn match   wlsOperator  "\.\."
syn match   wlsOperator  "\.\.\."
syn match   wlsOperator  "->"

" Decorators
syn match   wlsDecorator "@\w\+" nextgroup=wlsFuncDef skipwhite
syn match   wlsDecorator "@\w\+\.\w\+" nextgroup=wlsFuncDef skipwhite

" Comments
syn match   wlsComment   "#.*$" contains=@Spell

" Strings
syn region  wlsString    start=+"+ end=+"+ contains=@Spell
syn region  wlsString    start=+'+ end=+'+ contains=@Spell

" F-strings
syn region  wlsFString   start=+f"+ end=+"+ contains=@Spell,wlsInterpolation
syn region  wlsFString   start=+f'+ end=+'+ contains=@Spell,wlsInterpolation
syn region  wlsInterpolation contained start=+{+ end=+}+ keepend

" Numbers
syn match   wlsNumber    "\<\d\+\.\d*\>"
syn match   wlsNumber    "\<\d\+\>"
syn match   wlsNumber    "0[xX]\x\+"
syn match   wlsNumber    "0[bB][01]\+"
syn match   wlsNumber    "0[oO]\o\+"

" Function definitions (flower / def name(...))
syn match   wlsFuncDef   "\%(flower\|def\)\s\+\zs\w\+\ze\s*("

" Dunder identifiers (__name__, __main__, etc.)
syn match   wlsDunder    "\%(__\)\w\+\(__\)"

" Dotted attribute access (obj.method, module.attr)
syn match   wlsDotAccess "\w\+\.\w\+"

" Python built-in functions
syn keyword wlsPyBuiltin print input open
syn keyword wlsPyBuiltin len range type int str float bool list dict tuple set frozenset
syn keyword wlsPyBuiltin sorted reversed enumerate zip map filter
syn keyword wlsPyBuiltin min max sum abs round pow divmod hex oct bin ord chr
syn keyword wlsPyBuiltin all any isinstance issubclass hasattr getattr setattr delattr
syn keyword wlsPyBuiltin repr eval exec compile
syn keyword wlsPyBuiltin super object property classmethod staticmethod
syn keyword wlsPyBuiltin dir vars id hash callable iter next
syn keyword wlsPyBuiltin slice range memoryview bytearray bytes

" Python exceptions
syn keyword wlsPyException BaseException Exception
syn keyword wlsPyException ValueError TypeError IndexError KeyError AttributeError
syn keyword wlsPyException ImportError ModuleNotFoundError NameError UnboundLocalError
syn keyword wlsPyException RuntimeError RecursionError StopIteration StopAsyncIteration
syn keyword wlsPyException ArithmeticError ZeroDivisionError FloatingPointError OverflowError
syn keyword wlsPyException AssertionError EOFError FileNotFoundError IsADirectoryError
syn keyword wlsPyException SyntaxError IndentationError TabError SystemError
syn keyword wlsPyException LookupError MemoryError NotImplementedError
syn keyword wlsPyException OSError PermissionError FileExistsError
syn keyword wlsPyException ReferenceError SystemExit KeyboardInterrupt GeneratorExit

" Python special constants
syn keyword wlsPyConst   NotImplemented Ellipsis __debug__

" Links
hi def link wlsKeyword    Statement
hi def link wlsConditional Conditional
hi def link wlsControl    Statement
hi def link wlsImport     Include
hi def link wlsException  Exception
hi def link wlsDef        Keyword
hi def link wlsClass      Keyword
hi def link wlsOperator   Operator
hi def link wlsBoolean    Boolean
hi def link wlsNone       Constant
hi def link wlsType       Type
hi def link wlsSelf       Special
hi def link wlsAsync      Statement
hi def link wlsDecorator  Macro
hi def link wlsComment    Comment
hi def link wlsString     String
hi def link wlsFString    String
hi def link wlsInterpolation Special
hi def link wlsNumber     Number
hi def link wlsFuncDef    Identifier
hi def link wlsDunder     PreProc
hi def link wlsDotAccess  Type
hi def link wlsPyBuiltin  Function
hi def link wlsPyException Exception
hi def link wlsPyConst    Constant
hi def link wlsHeroes     Special

let b:current_syntax = "white_lily_script"
