const MONGO_URL = 'mongodb://pouyio:pouyio1590@ds163060.mlab.com:63060/comic-cache';

const SOURCE_URL = 'http://readcomiconline.to/';

const SECRET = 'myPubL!cS3cr3t';

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
    search: '/comics/search/:keyword/:genres([012]{47})?/:status(ongoing|completed)?',
    read: '/comics/read',
    news: '/comics/news'
  },
  comic: {
    detail: '/comic/:name',
    wish: '/comic_wish/:name',
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
  SECRET,
  GENRES,
  MONGO_URL,
  SOURCE_URL
})
