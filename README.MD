# TwineHacker

> To Debug(Or Cheat) Twine{SugarCube} Variables

based on extension from [this f95 thread](https://f95zone.to/threads/how-to-debug-or-cheat-twine-sugarcube-variables.6553/) 

(thanks to [@spectr3.9911](https://f95zone.to/members/spectr3.9911/#about))

compatible with Chrome and Firefox

## Installation instructions 
- **Chrome**: download repository and use *Developer Mode* then point directory
- **Firefox**: use *Firefox Developer Edition*, upload as *Temporary Extension* and point *TwineHacker.zip*
more later...

## Rewrite
Extension is completely rewritten, these are changes:
- **F12** - Extension has its own dev tools panel
- It's always open instead of being initially collapsed, so you might get scrolling
 (I hate this bug with not fully expandable panels and no possibility even to scroll)
- No keys to activate. If *TwH* has detected the game, it will show panel, otherwise empty.
- It's easy to add support to other engines (Wikifier etc)

## TODO
- support more games and game engines
- find out cheap(!) new variables detection
- fix extension death on a large amount of variables 

## Latest changes
- 01.07.2012 14:00 - hanging issues fixed (less computations, less cycles)
- 01.07.2012 23:00 - separate options page (in case if it still hangs) (so storage permissions are required)
- 02.07.2012 18:00 - black style, detection message
- 07.07.2012 00:00 - small fixes & changes, reorganized code
- 08.07.2012 00:00 - bugfix: checkbox initially not checked
- 09.07.2012 20:00 - bugfix: "changed" highlight fix
- 12.07.2012 13:00 - bugfix: "changed" highlight fix regression
- 18.07.2012 14:00 - alphabetical sorting
- 18.07.2012 23:00 - filter feature
- 04.08.2012 22:00 - *filter highlighting feature*
- 04.08.2012 23:00 - *separate field for highlighting feature*
- 04.08.2012 23:00 - *highlighting also found values (still not ideal)*

### List of tested games
- Inheritance
- Free Cities
- An Unexpected New Life
- The Ooze Wizard Apprentice
- Event Girl
- Favourite Teacher
- Girl Crush
- Paths
- Repurposing Center
- Degrees of Lewdity
- The Company
- Desideratum Blood Bonds
- Female agent

<details>
<summary>Spoiler Screenshots:</summary>

1. download it here: [https://github.com/lure0xaos/TwineHacker](https://github.com/lure0xaos/TwineHacker)

    1.1. click "Code" button, then "Download ZIP", and unzip it
![Безымянный0](https://user-images.githubusercontent.com/5437073/87243512-35a1c780-c43f-11ea-99ff-9ae73cf8a3ec.png)

2. How to install:

    2.1. Make sure "Developer mode" is on
    2.2. Click "Load unpacked" and choose directory where you've downloaded it (where manifest.json is among other files)
![Безымянный png](https://user-images.githubusercontent.com/5437073/87243532-641fa280-c43f-11ea-8988-eacc5515db1f.png)
    2.3. So you should see it's loaded without errors:
![Безымянный2](https://user-images.githubusercontent.com/5437073/87243542-7568af00-c43f-11ea-8633-effa6d2b49c4.png)

3. Open your game and press F12 to open Developer Tools sidebar, then switch to TwineHacker tab:
![Безымянный3](https://user-images.githubusercontent.com/5437073/87243544-7c8fbd00-c43f-11ea-9bd5-764e587e0252.png)


Now you can change any ingame value

</details>
