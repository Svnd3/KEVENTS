import chaiUrl from '../../songs/CHAI YA SAA KUMI (LYRIC VIDEO) - YWAYA TAJIRI [7b5aUIQ-sUc].mp3?url'
import etanaUrl from '../../songs/Etana - Love Song (lyrics) [gR-TPJXXcao].mp3?url'
import loversUrl from '../../songs/Hornsphere - FOR LOVERS ft. Mutoriah, Aliye, Noi (Official Music Video) [-5qz7ud10Ro].mp3?url'
import feelLoveUrl from '../../songs/Kahuti - Feel the Love (Lyrics) ft Kinoti [8JjrMVeZ1oo].mp3?url'
import karibuUrl from '../../songs/Kuja Karibu - Born Spectacle (Official Lyrics Video) [50ZmAuQL0xg].mp3?url'
import slowlyUrl from '../../songs/Meddy - Slowly ( Official Lyric Video) [YNKUgUYaMlE].mp3?url'
import betaUrl from '../../songs/Mutoriah - βeta (Official Video) [jmVGCnxnRug].mp3?url'
import comingHomeUrl from '../../songs/Sauti Sol - Coming Home (Official lyrics) [HdKXgXSLYt4].mp3?url'
import isabellaUrl from '../../songs/Sauti Sol - Isabella (Official Music Video) SMS [Skiza 1066769] to 811 [BS02l0cw140].mp3?url'
import wemaUrl from '../../songs/“WEMA ❤️by nk_njoroge ft fedora _ Swahili Love Song _ Kenyan Soul Music” [P3vhxHR9-no].mp3?url'
import mazuriUrl from '../../songs/YWAYA TAJIRI - MAZURI MABAYA (OFFICIAL VIDEO) [2ZcUqSTllYY].mp3?url'

const tracks = {
  chai: { title: 'Chai Ya Saa Kumi', src: chaiUrl },
  etana: { title: 'Love Song', src: etanaUrl },
  lovers: { title: 'For Lovers', src: loversUrl },
  feel: { title: 'Feel the Love', src: feelLoveUrl },
  karibu: { title: 'Kuja Karibu', src: karibuUrl },
  slowly: { title: 'Slowly', src: slowlyUrl },
  beta: { title: 'Beta', src: betaUrl },
  home: { title: 'Coming Home', src: comingHomeUrl },
  isabella: { title: 'Isabella', src: isabellaUrl },
  wema: { title: 'Wema', src: wemaUrl },
  mazuri: { title: 'Mazuri Mabaya', src: mazuriUrl },
}

const trackByVariant = {
  sande: 'chai',
  sunset: 'wema',
  weave: 'chai',
  arch: 'etana',
  beads: 'feel',
  tree: 'home',
  city: 'isabella',
  print: 'mazuri',
  mountain: 'home',
  glass: 'beta',
  electric: 'mazuri',
  blocks: 'beta',
  orbit: 'lovers',
  glow: 'slowly',
  type: 'lovers',
  woven: 'karibu',
  coastal: 'etana',
  mehndi: 'slowly',
  textile: 'karibu',
  crossweave: 'wema',
  cathedral: 'slowly',
  magazine: 'lovers',
  newspaper: 'isabella',
  editorial: 'lovers',
  couture: 'slowly',
  cover: 'feel',
  society: 'etana',
  ocean: 'etana',
  aegean: 'feel',
  vineyard: 'slowly',
  stars: 'home',
  mist: 'wema',
  spice: 'karibu',
  peony: 'slowly',
  pressed: 'wema',
  orchid: 'isabella',
  bougainvillea: 'feel',
  protea: 'wema',
  rose: 'etana',
  line: 'lovers',
  bow: 'isabella',
  serif: 'slowly',
  monogram: 'lovers',
  clay: 'beta',
  thread: 'wema',
  dawn: 'home',
  noir: 'isabella',
  cosmos: 'mazuri',
  reel: 'feel',
  blooming: 'wema',
  nightcity: 'isabella',
}

const categoryFallback = {
  African: 'wema',
  Modern: 'beta',
  Cultural: 'karibu',
  Editorial: 'lovers',
  Destination: 'home',
  Floral: 'feel',
  Minimal: 'slowly',
  Cinematic: 'isabella',
}

export function getSoundtrack(design) {
  const trackKey = trackByVariant[design?.variant] || categoryFallback[design?.category] || 'chai'
  return tracks[trackKey]
}
