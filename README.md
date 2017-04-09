Current functionality:

  * Version 1: Command that takes N YouTube video IDs, caches them locally

  * Version 2: Creates a composite video split horizontally then vertically N times

Planned functionality:

  * Version 3: Composite starts with the longest video playing full screen,
    then splits out to include the next video in the timeline.

  * Version 4: Always play the audio from the most recent video.

Known issues:

  * The scaling does not preserve aspect ratio properly.

How to display all of the fights between [Peter Griffin](https://en.wikipedia.org/wiki/Peter_Griffin) and [Ernie the Giant Chicken](http://familyguy.wikia.com/wiki/Ernie_The_Giant_Chicken)

```bash
  $ npm start -- \
    xrziHnudx3g \
    XjkSZBeOdxQ \
    1l_WajgALHk \
    yqLhgnDEchY \
    W4WGQmWcrbs \
    DmxNZJ-WKbo
```

Videos in order are -
  * From episode 'Da Boom'
  * From episode 'Blind Ambition'
  * From episode 'No Chris Left Behind'
  * From the video game 'The Quest for Stuff'
  * From the episode 'Internal Affairs'
  * From the episode 'The Simpsons Guy' - Peter vs Homer

Want to add a little of fun by having an odd number of videos? Try tacking on 2Z4m4lnjxkY to the end.
