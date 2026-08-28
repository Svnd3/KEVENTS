import chaiUrl from '../../songs/CHAI YA SAA KUMI (LYRIC VIDEO) - YWAYA TAJIRI [7b5aUIQ-sUc].mp3?url'

const bundledTrack = {
  title: 'Chai Ya Saa Kumi',
  artist: 'Ywaya Tajiri',
  src: chaiUrl,
  idleLabel: 'Play song',
  playingLabel: 'Sound on',
  tone: 'default',
  volume: 0.28,
}

const templateTracks = {
  'scroll-blue': {
    title: 'FOR LOVERS',
    artist: 'Hornsphere ft. Mutoriah, Aliye & Noi',
    src: '/audio/soft-launch-for-lovers-v1.mp3',
    idleLabel: 'Play the mood',
    playingLabel: 'For Lovers · Playing',
    tone: 'soft-launch',
    volume: 0.22,
  },
  'scroll-candy': {
    title: 'Feel the Love',
    artist: 'Kahuti ft. Kinoti',
    src: '/audio/love-bomb-feel-the-love-v1.mp3',
    idleLabel: 'Turn the love up',
    playingLabel: 'Feel the Love · Playing',
    tone: 'love-bomb',
    volume: 0.22,
  },
}

export function getSoundtrack(design) {
  return templateTracks[design?.variant] || bundledTrack
}
