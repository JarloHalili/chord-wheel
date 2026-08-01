/* ================================================================
   Chord Wheel — song data

   Add, remove, or edit songs here. The app reads this file on load
   and builds the "Song" dropdown from whatever keys are listed below
   — you don't need to touch chord-wheel.html at all.

   Format for each song:
     key: {
       name: "Display name shown in the dropdown",
       chords: ["Chord1", "Chord2", ...],  // clockwise from the top slice
       lyrics: `...`                        // optional — see below
     }

   Chord symbol rules:
     - Root note: C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B  (or C#, D#, F#, G#, A# — either spelling works)
     - Quality suffix (optional): "" = major, "m" = minor, "7" = dominant 7th,
       "maj7", "m7", "dim", "dim7", "aug", "sus2", "sus4"
     - Slash/bass note (optional): e.g. "Ebm/Bb" = Eb minor chord over a Bb bass note

   The wheel automatically divides itself into as many slices as the
   selected song has chords (3 chords = 3 slices, 8 chords = 8 slices, etc).
   Keep it to 8 or fewer for a wheel that's easy to hit accurately.

   LYRICS FORMAT (ChordPro-style):
     Put the chord in square brackets immediately before the word it lands
     on. Blank lines become paragraph breaks in the lyrics tab. For example:

       lyrics: `
[Db]Have yourself a [Gb]merry little [F]Christmas,
[Bb7]let your heart be [Ebm]light

[Ab7]From now [Ebm/Bb]on our [Ab]troubles will be [Db]out of sight
       `

   NOTE ON COPYRIGHT: actual song lyrics are copyrighted, so they aren't
   included here — the "lyrics" fields below are just placeholder text
   showing the bracket format. Paste in the real lyrics yourself (from a
   copy you already have, e.g. a hymnal, sheet music, or your own
   transcription) following the same [Chord]word pattern above.
   ================================================================ */

window.CHORD_WHEEL_SONGS = {

  look_like_christmas: {
    name: "It's Beginning to Look a Lot Like Christmas",
    chords: ['Db', 'Gb', 'F', 'Bb7', 'Ebm', 'Ab7', 'Ebm/Bb', 'Ab'],
    lyrics: `
It's [Db]beginning to look a [Gb]lot like [Db]Christmas,
[Db]Toys in [F]every [Gb]store, [Bb7]

But the [Ebm]prettiest sight to [Ab7]see is the [Db]holly that will [Bb7]be
On [Ebm/Bb]your own  [Ab]front [Db]door.
    `
  },

  holly_jolly: {
    name: "Holly Jolly Christmas",
    chords: ['E', 'B7', 'F#7'],
    lyrics: `
Have a [E]holly, jolly Christmas, it's the best time of the [B7]year,
I don't know if there'll be snow, but have a cup of [E]cheer.

Have a [E]holly, jolly Christmas and in case you didn't [B7]hear,
Oh, by golly, have a [E]holly, jolly [F#7]Christmas [B7]this [E]year.
    `
  },

  they_call_this_love: {
    name: "I Think They Call This Love",
    chords: ['A', 'F#m', 'D', 'E'],
    lyrics: `
All I [A]dream of is your [F#m]eyes
All I [D]long for is your [E]touch
And, [A]darlin', something [F#m]tells me that's [D]enough, hmmmmmm [E]

You can [D]say that I'm a [E]fool
And I [A]don't know very [F#m]much
But I [D]think they [E]call this [A]love
    `
  }

  // Add more songs below, following the same pattern. For example:
  //
  // jingle_bells: {
  //   name: "Jingle Bells",
  //   chords: ['C', 'F', 'G7'],
  //   lyrics: `[C]Your lyrics [F]here...`
  // },

};

