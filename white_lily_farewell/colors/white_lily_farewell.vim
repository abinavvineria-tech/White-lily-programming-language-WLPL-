" white_lily_farewell.vim -- White Lily Cookie Memorial Colorscheme
" Maintainer: white_lily_farewell
" License: MIT

highlight clear
if exists("syntax_on")
  syntax reset
endif

let g:colors_name = "white_lily_farewell"
set background=dark

lua require("white_lily_farewell").load_colorscheme()
