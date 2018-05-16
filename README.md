# ScannerBase

This a rudimentary project of regexp-to-DFA translator and visualizer (not yet a scanner!) made around 2016.

The project's structure is recently refactored, but most of the code are still in the old ES5 fashion and not well-settled.

Functionality
-------------

It can:

* transform regexp into regexp-AST
* transform regexp-AST into NFA (only simple operators: `*`, `+`, `?`, and `()`, are supported)
* transform NFA into DFA
* transform DFA into OFA (the optimized version)

, and generate visualization of them.


Web page
--------

This project is *ready to use* as a web application.

You can *try it now* [**HERE**](https://zetaraku.github.io/ScannerBase/) !


License
-------

Copyright © 2017, Raku Zeta. Licensed under the MIT license.

Other used libraries and license infomation are located in `./src/js/lib/`.
