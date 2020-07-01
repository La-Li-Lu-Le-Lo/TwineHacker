# TwineHacker

> To Debug(Or Cheat) Twine{SugarCube} Variables

taken from [this f95 thread](https://f95zone.to/threads/how-to-debug-or-cheat-twine-sugarcube-variables.6553/) and slightly updated
compatible with Chrome and Firefox

## Installation instructions 
- **chrome**: download repository and use *Developer Mode* then point directory
- **firefox**: use *Firefox Developer Edition*, upload as *Temporary Extension* and point *TwineHacker.zip*
more later...

## Rewrite
Had to completely rewrite extension, basing on original logic with slight modifications:
- **F12** - Now extension has its own dev tools panel
- It's always open instead of being initially collapsed, so you might get scrolling
 (I hate this bug with not fully expandable panels and no possibility even to scroll)
- No keys to activate. If TwH has detected the game, it will show panel, otherwise empty.
- It's easy to add support to other engines (Wikifier etc)

## TODO
- support more games and game engines

## Latest changes
- 01.07.2012 14:00 - hanging issues fixed
