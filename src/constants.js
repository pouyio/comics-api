const ROUTES = {
  all: '/*',
  root: '/',
  img: '/img/*',
  auth: {
    login: '/login',
    logout: '/logout'
  },
  comics: {
    list: '/comics/:letter(0|[a-z])?/:page(\\d+)?',
    search_old: '/comics/search_old/:keyword/:genres([012]{47})?/:status(ongoing|completed)?',
    search: '/comics/search',
    read: '/comics/read',
    news: '/comics/news'
  },
  comic: {
    detail: '/comic/:name',
    issue: '/comic/:name/:issue'
  },
  genres: '/genres/:name?/:page?',
  publishers: '/publishers/:name/:page?',
  writers: '/writers/:name/:page?',
  artists: '/artists/:name/:page?'
};

const GENRES = ['Action', 'Adventure', 'Anthology', 'Anthropomorphic', 'Biography', 'Children', 'Comedy', 'Crime', 'Drama', 'Family', 'Fantasy', 'Fighting', 'Graphic Novels', 'Historical', 'Horror', 'Leading Ladies', 'LGBTQ', 'Literature', 'Manga', 'Martial Arts', 'Mature', 'Military', 'Movies & TV', 'Mystery', 'Mythology', 'Personal', 'Political', 'Post-Apocalyptic', 'Psychological', 'Pulp', 'Religious', 'Robots', 'Romance', 'School Life', 'Sci-Fi', 'Slice of Life', 'Sport', 'Spy', 'Superhero', 'Supernatural', 'Suspense', 'Thriller', 'Vampires', 'Video Games', 'War', 'Western', 'Zombies'];

Object.assign(module.exports, {
  ROUTES,
  GENRES
})
