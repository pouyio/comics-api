const ROUTES = {
  all: '/*',
  root: '/',
  img: '/img/*',
  auth: {
    login: '/login'
  },
  comics: {
    search: '/comics/search',
    read: '/comics/read'
  },
  comic: {
    detail: '/comic/:name',
    issue: '/comic/:name/:issue'
  }
};

Object.assign(module.exports, {
  ROUTES
})
