import chaiUrl from '../../songs/CHAI YA SAA KUMI (LYRIC VIDEO) - YWAYA TAJIRI [7b5aUIQ-sUc].mp3?url'

const bundledTrack = { title: 'Chai Ya Saa Kumi', src: chaiUrl }

// Keep previews deployable from a clean checkout. Additional local songs are
// intentionally ignored until their distribution rights and files are bundled.
export function getSoundtrack() {
  return bundledTrack
}
