export const categories = ['All', 'African', 'Modern', 'Cultural', 'Editorial', 'Destination', 'Floral', 'Minimal', 'Cinematic']

const rawDesigns = [
  ['Savannah Vows', 'African', 8500, 'Where your forever meets the horizon.', 'sunset', ['#d99255', '#231b16', '#f4d5a5', '#7a3f2b'], 'savannah.webp', 'Amara', 'Eli', ['Earthy', 'Gentle Motion', 'Story Scroll']],
  ['Zuri Weave', 'African', 10500, 'A bold beginning, beautifully woven.', 'weave', ['#1648aa', '#fff6dc', '#f3aa20', '#e43f6f'], null, 'Zuri', 'Kito', ['Bright', 'Interactive', 'Multi-Event Suite']],
  ['Karibu', 'African', 22000, 'Made to be opened with the sound on.', 'sande', ['#2147b7', '#f7f3e9', '#ff6b66', '#10172f'], null, 'Zuri', 'Kito', ['Full Screen', 'Music', 'RSVP']],
  ['Lamu Moon', 'African', 12500, 'Salt air, moonlight, and two hearts.', 'arch', ['#102d43', '#f4edda', '#8cbeb4', '#d1a85a'], 'ocean.webp', 'Leila', 'Noah', ['Jewel', 'Interactive', 'RSVP-Ready']],
  ['Beaded Horizon', 'African', 11500, 'A radiant promise in every circle.', 'beads', ['#9f2f38', '#f1dcc0', '#25a4a0', '#121212'], null, 'Wanjiru', 'Amani', ['Bold', 'Interactive', 'Story Scroll']],
  ['Baobab Promise', 'African', 7500, 'Rooted in love. Growing together.', 'tree', ['#a95536', '#f6edda', '#768363', '#3c271f'], 'savannah.webp', 'Nia', 'Jabari', ['Earthy', 'Gentle Motion', 'Single Page']],
  ['Nairobi Noir', 'African', 14000, 'City lights. Timeless vows.', 'city', ['#121213', '#ead9bf', '#9f5974', '#dfb76f'], 'city-night.webp', 'Imani', 'Taji', ['Dark', 'Cinematic', 'Photo-Led']],
  ['Ankara Bloom', 'African', 13000, 'Pattern, colour, celebration.', 'print', ['#143f89', '#fff3d6', '#e03578', '#f0ae27'], null, 'Ada', 'Bayo', ['Bright', 'Interactive', 'Multi-Event Suite']],
  ['Kilimanjaro Dawn', 'African', 9000, 'Love, at its highest point.', 'mountain', ['#b8d8e8', '#273440', '#ffc6a2', '#9185b8'], 'mountain.webp', 'Neema', 'Baraka', ['Pastel', 'Gentle Motion', 'Story Scroll']],
  ['Glasshouse', 'Modern', 9500, 'A clear view of forever.', 'glass', ['#c7e4ef', '#1d2731', '#ffffff', '#7b96a4'], null, 'June', 'Theo', ['Neutral', 'Interactive', 'Single Page']],
  ['Electric Monogram', 'Modern', 11000, 'Your initials, in a new light.', 'electric', ['#17162b', '#faf7ff', '#7357ff', '#46d9e6'], null, 'Maya', 'Leo', ['Jewel', 'Interactive', 'RSVP-Ready']],
  ['Color Theory', 'Modern', 6500, 'Two lives. One brilliant composition.', 'blocks', ['#f1d64b', '#161616', '#265acc', '#df4d37'], null, 'Lena', 'Sol', ['Bright', 'Still', 'Single Page']],
  ['Orbit', 'Modern', 8500, 'Everything led us here.', 'orbit', ['#f2f2ed', '#121212', '#a2a9ae', '#2159cf'], null, 'Aria', 'Ezra', ['Neutral', 'Interactive', 'Single Page']],
  ['Afterglow', 'Modern', 8000, 'Stay in the feeling.', 'glow', ['#f9bf9d', '#202033', '#c7a9ed', '#ef889d'], null, 'Iris', 'Finn', ['Pastel', 'Gentle Motion', 'Single Page']],
  ['Muse', 'Modern', 12000, 'For a love that sets the tone.', 'type', ['#e8e0d2', '#161616', '#a92327', '#b7b7b7'], 'wedding-couple.webp', 'Mila', 'Jude', ['Bold', 'Interactive', 'Photo-Led']],
  ['Rũracio Reverie', 'Cultural', 14000, 'A joyful meeting of families.', 'woven', ['#284936', '#fff3dc', '#ad5538', '#d0a64a'], null, 'Wairimu', 'Kamau', ['Earthy', 'Interactive', 'Multi-Event Suite']],
  ['Swahili Nikah', 'Cultural', 12000, 'Written in grace, sealed by the sea.', 'coastal', ['#f4ebd8', '#1f594f', '#d6bd79', '#8bb9b1'], 'ocean.webp', 'Aisha', 'Omar', ['Neutral', 'Gentle Motion', 'Multi-Event Suite']],
  ['Mehndi Garden', 'Cultural', 12500, 'Every delicate detail tells your story.', 'mehndi', ['#f1d0b4', '#572f25', '#dd8c35', '#f8eee0'], null, 'Anika', 'Ravi', ['Earthy', 'Interactive', 'Multi-Event Suite']],
  ['Aṣọ-Oke Royale', 'Cultural', 15000, 'Woven for a celebration of legacy.', 'textile', ['#5c1631', '#fff0dc', '#de7457', '#293e76'], null, 'Sade', 'Femi', ['Jewel', 'Cinematic', 'Multi-Event Suite']],
  ['Habesha Gold', 'Cultural', 13500, 'Tradition shines in every detail.', 'crossweave', ['#f0e1c7', '#2d553e', '#ba7d36', '#a14932'], null, 'Liya', 'Dawit', ['Metallic', 'Interactive', 'Story Scroll']],
  ['Cathedral Ivory', 'Cultural', 7000, 'A classic promise, beautifully kept.', 'cathedral', ['#f3eddf', '#191d2d', '#77303c', '#bc9454'], 'wedding-flowers.webp', 'Clara', 'David', ['Formal', 'Still', 'Single Page']],
  ['Ivory Issue', 'Editorial', 11000, 'Your love, front and centre.', 'magazine', ['#ebe6dc', '#161616', '#8d8173', '#ececec'], 'wedding-couple.webp', 'Ella', 'James', ['Neutral', 'Interactive', 'Photo-Led']],
  ['Noir Gazette', 'Editorial', 9500, 'The headline: forever starts here.', 'newspaper', ['#e8e4d9', '#171717', '#a72c2c', '#88847b'], 'wedding-dance.webp', 'Amélie', 'Noah', ['Dark', 'Gentle Motion', 'Photo-Led']],
  ['The Wedding Edit', 'Editorial', 13000, 'Curated moments. One unforgettable day.', 'editorial', ['#e9e1d1', '#35281f', '#657054', '#bba784'], 'wedding-field.webp', 'Sophia', 'Henry', ['Earthy', 'Interactive', 'Photo-Led']],
  ['Maison Amour', 'Editorial', 15000, 'A study in modern romance.', 'couture', ['#f1efea', '#171717', '#781f2a', '#a59e94'], 'wedding-bouquet.webp', 'Céline', 'Marc', ['Formal', 'Cinematic', 'Photo-Led']],
  ['Cover Story', 'Editorial', 17000, 'The issue everyone has been waiting for.', 'cover', ['#f8f8f5', '#262626', '#cf343e', '#a8a8a3'], 'wedding-celebration.webp', 'Layla', 'Kai', ['Bold', 'Cinematic', 'Story Scroll']],
  ['Society Pages', 'Editorial', 10000, 'Consider this your formal announcement.', 'society', ['#e9dfca', '#182c48', '#315141', '#b5904d'], null, 'Rose', 'Arthur', ['Formal', 'Gentle Motion', 'Single Page']],
  ['Diani Tide', 'Destination', 8500, 'Meet us where the ocean turns turquoise.', 'ocean', ['#42a9b8', '#fffef8', '#efb38d', '#e6d6b7'], 'ocean.webp', 'Kendi', 'Alex', ['Bright', 'Gentle Motion', 'Story Scroll']],
  ['Santorini Blue', 'Destination', 9500, 'Aegean light. Endless love.', 'aegean', ['#1650a2', '#fffdf6', '#d62e83', '#9bd4e0'], 'ocean.webp', 'Elena', 'Niko', ['Bright', 'Interactive', 'Story Scroll']],
  ['Tuscan Hour', 'Destination', 10500, 'Golden hour was made for this.', 'vineyard', ['#d6b378', '#373b22', '#b45c3e', '#ede0bd'], 'wedding-table.webp', 'Lucia', 'Matteo', ['Earthy', 'Gentle Motion', 'Story Scroll']],
  ['Mara Under Stars', 'Destination', 14500, 'Our wildest adventure begins.', 'stars', ['#0c1930', '#f0cf7d', '#8a4d35', '#25395a'], 'savannah.webp', 'Zawadi', 'Ethan', ['Dark', 'Cinematic', 'Photo-Led']],
  ['Naivasha Mist', 'Destination', 7500, 'A quiet lake, a beautiful beginning.', 'mist', ['#b7c7bd', '#33473e', '#a9bcc7', '#f0ecdf'], 'mountain.webp', 'Akinyi', 'Sam', ['Serene', 'Gentle Motion', 'Single Page']],
  ['Zanzibar Spice', 'Destination', 11500, 'Follow the scent of sea and celebration.', 'spice', ['#a6472b', '#f5e3c5', '#1d7772', '#db8a3b'], 'ocean.webp', 'Mariam', 'Idris', ['Earthy', 'Interactive', 'Multi-Event Suite']],
  ['Peony Silk', 'Floral', 9000, 'Soft petals. Grand romance.', 'peony', ['#edc1c6', '#4b3036', '#f4eadf', '#b58b69'], 'wedding-bouquet.webp', 'Maeve', 'Oliver', ['Pastel', 'Gentle Motion', 'Single Page']],
  ['Wildflower Press', 'Floral', 5500, 'Love, naturally in bloom.', 'pressed', ['#f2df8f', '#4a5f44', '#91add3', '#f7f0dc'], null, 'Poppy', 'Ben', ['Pastel', 'Still', 'Single Page']],
  ['Orchid Noir', 'Floral', 13000, 'Rare beauty after dark.', 'orchid', ['#16141a', '#f5eced', '#734374', '#a9afb7'], 'wedding-bouquet.webp', 'Aya', 'Luca', ['Dark', 'Interactive', 'Story Scroll']],
  ['Bougainvillea Kiss', 'Floral', 8000, 'Bright, warm, impossible to forget.', 'bougainvillea', ['#d92f80', '#fff8ee', '#f48e79', '#477d58'], null, 'Nadia', 'Milo', ['Bright', 'Gentle Motion', 'Single Page']],
  ['Protea Crown', 'Floral', 10500, 'A bold bloom for a beautiful union.', 'protea', ['#d49ba0', '#435c4f', '#ba6d55', '#f1e8d6'], null, 'Thandi', 'Luke', ['Earthy', 'Interactive', 'RSVP-Ready']],
  ['Rosewater Garden', 'Floral', 7000, 'A gentle invitation to forever.', 'rose', ['#e8b3b7', '#6c4958', '#a6b888', '#f8eadf'], null, 'Rosa', 'Dean', ['Pastel', 'Still', 'Single Page']],
  ['Barely There', 'Minimal', 3000, 'Only what matters.', 'line', ['#f4f1e9', '#181818', '#d9d4ca', '#181818'], null, 'Ava', 'Eli', ['Neutral', 'Still', 'Single Page']],
  ['Black Tie Line', 'Minimal', 4500, 'Formal, flawless, forever.', 'bow', ['#efefec', '#090909', '#bcbcb6', '#272727'], null, 'Grace', 'Miles', ['Formal', 'Still', 'Single Page']],
  ['Quiet Serif', 'Minimal', 3500, 'A whisper of elegance.', 'serif', ['#e8ddca', '#382b24', '#b7a895', '#6b574a'], null, 'Mara', 'Jonah', ['Neutral', 'Still', 'Single Page']],
  ['Monogram Blanc', 'Minimal', 5000, 'Two letters. One life.', 'monogram', ['#eeeae1', '#55504b', '#b59a63', '#d7d0c4'], null, 'Nora', 'Theo', ['Metallic', 'Gentle Motion', 'Single Page']],
  ['Terracotta Type', 'Minimal', 4000, 'Warm words for a modern love.', 'clay', ['#b85d3e', '#f4e4cf', '#d59771', '#2c2925'], null, 'Sana', 'Owen', ['Earthy', 'Still', 'Single Page']],
  ['Silver Thread', 'Minimal', 6000, 'Connected by the finest detail.', 'thread', ['#efefed', '#414a53', '#afb6bd', '#fafafa'], null, 'Elle', 'Remy', ['Neutral', 'Gentle Motion', 'Single Page']],
  ['Soft Launch: Forever', 'Cinematic', 24000, 'The soft launch is over. Forever starts here.', 'scroll-blue', ['#a9dbe7', '#171316', '#ae0f2f', '#f8f2e7'], 'soft-launch-cover.webp', 'Nia', 'Julian', ['Scroll Film', 'Interactive', 'RSVP-Ready']],
  ['Love Bomb', 'Cinematic', 26000, 'Big love. Main-character motion.', 'scroll-candy', ['#ec6ba9', '#171316', '#8ce9d4', '#ffcf3d'], 'love-bomb-cover.webp', 'Amara', 'Kai', ['Bold', 'Scroll Film', 'RSVP-Ready']],
  ['Love, in Transit', 'Cinematic', 28000, 'One ticket. Two hearts. A beautifully timed arrival.', 'scroll-transit', ['#f4b7c8', '#171316', '#7ec4d8', '#f7f0e5'], 'love-in-transit-cover.webp', 'Maya', 'Eli', ['Scroll Film', 'Music', 'RSVP-Ready']],
  ['Scarlet Hour', 'Cinematic', 29000, 'A red-letter night, written in motion.', 'scroll-scarlet', ['#bd1538', '#171012', '#f2a3ad', '#f8eadf'], 'scarlet-hour-cover.webp', 'Zara', 'Jude', ['Bold', 'Scroll Film', 'RSVP-Ready']],
  ['First Light', 'Cinematic', 16000, 'The story begins at sunrise.', 'dawn', ['#eaa56a', '#fff4da', '#84add0', '#725848'], 'wedding-field.webp', 'Aria', 'Theo', ['Romantic', 'Cinematic', 'Photo-Led']],
  ['Film Noir Vows', 'Cinematic', 18000, 'A timeless love, dramatically told.', 'noir', ['#111111', '#f4f2ed', '#8b8b8b', '#d7d7d2'], 'wedding-dance.webp', 'Vivian', 'Cole', ['Dark', 'Cinematic', 'Photo-Led']],
  ['Celestial Overture', 'Cinematic', 22000, 'Written in the stars. Revealed in motion.', 'cosmos', ['#0f1024', '#f5e9c9', '#6a4fb7', '#c7b078'], null, 'Luna', 'Atlas', ['Jewel', 'Cinematic', 'Story Scroll']],
  ['The Love Reel', 'Cinematic', 19500, 'Press play on forever.', 'reel', ['#b1664d', '#f4e6cd', '#9b2429', '#181716'], 'wedding-celebration.webp', 'Rhea', 'Kit', ['Bold', 'Cinematic', 'Photo-Led']],
  ['Garden in Motion', 'Cinematic', 17500, 'Watch your invitation bloom.', 'blooming', ['#8aa47a', '#f8eee4', '#d990a0', '#e6be63'], 'wedding-flowers.webp', 'Olive', 'Jasper', ['Romantic', 'Cinematic', 'Story Scroll']],
  ['Midnight in Nairobi', 'Cinematic', 20000, 'One city. One night. One forever.', 'nightcity', ['#101622', '#f3d08c', '#276cc5', '#d5c0a4'], 'city-night.webp', 'Njeri', 'Malik', ['Dark', 'Cinematic', 'Photo-Led']],
]

const slugify = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '')

export const designs = rawDesigns.map((design, index) => {
  const [name, category, price, tagline, variant, palette, image, personOne, personTwo, tags, eventType = 'Wedding'] = design
  return {
    id: index + 1,
    slug: slugify(name),
    name,
    category,
    price,
    tagline,
    variant,
    palette,
    image: image ? `/images/${image}` : null,
    couple: [personOne, personTwo],
    tags,
    eventType,
    featured: ['Soft Launch: Forever', 'Love Bomb', 'Love, in Transit', 'Scarlet Hour', 'Lamu Moon', 'Ivory Issue', 'Celestial Overture', 'Savannah Vows', 'Nairobi Noir'].includes(name),
  }
})

export const formatPrice = (price) => `KSh ${price.toLocaleString('en-KE')}`
