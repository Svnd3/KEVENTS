import chaiUrl from '../../songs/CHAI YA SAA KUMI (LYRIC VIDEO) - YWAYA TAJIRI [7b5aUIQ-sUc].mp3?url'

const bundledTrack = { title: 'Chai Ya Saa Kumi', src: chaiUrl }

const importedTracks = {
  'the-sacred-garden': {
    title: 'Mazuri Mabaya',
    artist: 'Ywaya Tajiri',
    src: '/audio/webgency-mazuri-mabaya.mp3',
    buttonLabel: 'Play soundtrack',
    volume: 0.2,
  },
  'blossom-oud': {
    title: 'Slowly',
    artist: 'Meddy',
    src: '/audio/webgency-slowly.mp3',
    buttonLabel: 'Play soundtrack',
    volume: 0.2,
  },
  'dolce-vita': {
    title: 'Wema',
    artist: 'NK Njoroge ft. Fedora',
    src: '/audio/webgency-wema.mp3',
    buttonLabel: 'Play soundtrack',
    volume: 0.21,
  },
  'vibrant-vows': {
    title: 'Isabella',
    artist: 'Sauti Sol',
    src: '/audio/love-in-transit-isabella.mp3',
    buttonLabel: 'Play soundtrack',
    volume: 0.22,
  },
  'destination-love': {
    title: 'Coming Home',
    artist: 'Sauti Sol',
    src: '/audio/up-up-always-coming-home.mp3',
    buttonLabel: 'Play soundtrack',
    volume: 0.2,
  },
  'eternal-romance': {
    title: 'Chai Ya Saa Kumi',
    artist: 'Ywaya Tajiri',
    src: '/audio/webgency-chai-ya-saa-kumi.mp3',
    buttonLabel: 'Play soundtrack',
    volume: 0.2,
  },
  'royal-gold': {
    title: 'FOR LOVERS',
    artist: 'Hornsphere ft. Mutoriah, Aliye & Noi',
    src: '/audio/soft-launch-for-lovers.mp3',
    buttonLabel: 'Play soundtrack',
    volume: 0.2,
  },
  minimalist: {
    title: 'Love Song',
    artist: 'Etana',
    src: '/audio/heart-parade-love-song.mp3',
    buttonLabel: 'Play soundtrack',
    volume: 0.18,
  },
}

// Keep every other preview on the original bundled, deployable fallback.
export function getSoundtrack(design) {
  return importedTracks[design?.slug] ?? bundledTrack
}
