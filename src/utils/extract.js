// TODO remove promises from here
const cheerio = require('cheerio');
const make_url = require('./make_url');
const CONST = require('../constants');

const _get_url_last_part = (url) => url.replace(/^.*?\/([^\/]+?)(\?.+)?$/, '$1').toLowerCase();

const _get_url_img = (url) => url.replace(process.env.SOURCE_URL, `${process.env.API_URL}/img/`);

const _get_linked_data = ($data, type) => {
  const id = _get_url_last_part($data.attr('href'));

  return {
    type,
    id,
    attributes: {
      name: $data.text()
    },
    links: {
      self: make_url(`/${type}/${id}`)
    }
  };
}

const _get_person_data = ($data, type) => {
  const id = _get_url_last_part($data.attr('href'));
  const name = $data.text().split(' ');

  return {
    type,
    id,
    attributes: {
      first_name: name[0],
      last_name: name[name.length - 1]
    },
    links: {
      self: make_url(`/${type}/${id}`)
    }
  };
}


const details = (body, request) => {
  var p = new Promise((resolve, reject) => {
    var $ = cheerio.load(body);
    var $data = $('#leftside > .bigBarContainer:first-child > .barContent');
    if (!$data.length) resolve({});
    var cover_url = $('#rightside > .rightBox:first-child > .barContent img').attr('src');

    var json_data = {
      data: {
        type: 'comics',
        id: request.params.name,
        attributes: {
          title: $data.find('.bigChar').text().trim()
        },
        relationships: {},
        links: {
        }
      },
      included: [],
      links: []
    };

    $data.find('p').each((index, item) => {
      var $item = $(item);
      var info_name = $item.find('.info:first-child').text().replace(/:/, '');

      switch(info_name) {
        case 'Genres':
          $item.find('a').each((_, genre) => {
            var genre_data = _get_linked_data($(genre), 'genres');

            json_data.included.push(genre_data);

            if (!json_data.data.relationships.genres) {
              json_data.data.relationships.genres = [];
            }

            json_data.data.relationships.genres.push({
              id: genre_data.id,
              type: genre_data.type
            });
          });

          break;

        case 'Publisher':
          var publisher_data = _get_linked_data($item.find('a'), 'publishers');

          json_data.included.push(publisher_data);

          json_data.data.relationships.publisher = {
            id: publisher_data.id,
            type: publisher_data.type
          };

          break;

        case 'Writer':
          var writer_data = _get_person_data($item.find('a'), 'writers');

          json_data.included.push(writer_data);
          json_data.data.relationships.writer = {
            id: writer_data.id,
            type: writer_data.type
          };

          break;

        case 'Artist':
          var artist_data = _get_person_data($item.find('a'), 'artists');

          json_data.included.push(artist_data);
          json_data.data.relationships.artist = {
            id: artist_data.id,
            type: artist_data.type
          };

          break;

        case 'Publication date':
          json_data.data.attributes.publication_date = $item.text().match(/publication date:\s+(.+)/i)[1].trim();
          break;

        case 'Status':
          json_data.data.attributes.status = $item.text().match(/status:\s+(.+?)\s+/i)[1].trim();
          break;

        case 'Summary':
          json_data.data.attributes.summary = $item.next().text().trim();
          break;
      }
    });

    $('.listing').find('tr').each((index, item) => {
      var $item = $(item);

      if ($item.find('a').length > 0) {
        var title = $item.find('a').text().trim();
        var issue_id = _get_url_last_part($item.find('a').attr('href'));
        var url = make_url(CONST.ROUTES.comic.issue, { name: json_data.data.id, issue: issue_id });
        var release_day = $item.find('td:last-child').text().trim();
        var issue = {
          id: `${json_data.data.id}-${issue_id}`,
          type: 'issues',
          attributes: {
            title: title,
            release_day: release_day
          },
          links: {
            self: url
          }
        };

        var match = title.match(/issue #(\d+)/i);

        if (!!match) {
          issue.attributes.number = Number(match[1]);
        }

        json_data.included.push(issue);

        if (!json_data.data.relationships.issues) {
          json_data.data.relationships.issues = [];
        }

        json_data.data.relationships.issues.push({
          id: issue.id,
          type: issue.type
        });
      }
    });

    json_data.data.links.cover = _get_url_img(cover_url);
    resolve(json_data);

  });
  p.__name = 'Comic details';
  return p;
};

// TODO use es6
const listing = (body, request) => {
  var $ = cheerio.load(body);
  var params = request.params;
  var all_comics = [];
  var $all_rows = $('table.listing').find('tr');
  var $pager = $('.pagination').find('.pager');
  var letter_link_part = !!params.letter ? `/${params.letter}` : '';
  var current_page_number = Number(params.page || '1');
  var last_page_number = $pager.find('li:last-child');
  last_page_number = Number(last_page_number.hasClass('current') ? last_page_number.text() : last_page_number.find('a').attr('page'));

  var links = {};

  var link_params = Object.assign({}, params);
  delete link_params.page;

  if (current_page_number > 1) {
    links.first = make_url(request.route.path, link_params);

    if (current_page_number > 2) {
      links.previous = make_url(request.route.path, Object.assign({}, link_params, { page: current_page_number - 1 }));
    }
    else {
      links.previous = links.first;
    }
  }

  if (current_page_number < last_page_number) {
    Object.assign(links, {
      next: make_url(request.route.path, Object.assign({}, link_params, { page: current_page_number + 1 })),
      last: make_url(request.route.path, Object.assign({}, link_params, { page: last_page_number }))
    });
  }

  var all_comics_with_covers = [];

  $all_rows.each((index, item) => {
    var $item = $(item);

    if ($item.find('td a').length > 0) {
      var $name_cell = $item.find('td:first-child');
      var $url = $name_cell.find('a');
      var is_finished = $item.find('td:last-child a').length == 0;
      var comic_id = $url.attr('href').replace(/^\/Comic\//i, '').toLowerCase();
      var cover_url = $name_cell.attr('title').match(/img\s*.*?\s*src="(.*?)"/)[1];
      var comic = {
        type: 'comics',
        id: comic_id,
        attributes: {
          title: $url.text().trim(),
          finished: is_finished
        },
        links: {
          self: make_url(CONST.ROUTES.comic.detail, { name: comic_id }),
          cover: cover_url
        }
      };

      all_comics_with_covers.push(comic);
    }
  });

  return new Promise((resolve, reject) => {
    resolve({
      links: links,
      data: all_comics_with_covers
    });
  });
}

const issue = (body) => {
  var data = [];

  var lines = body.split("\n");

  for (var line of lines) {
    var match = line.match(/lstImages\.push\(["'](.*?)["']\);/i);

    if (!!match) {
      data.push(match[1]);
    }
  };

  var p = Promise.resolve(data);
  return p;
};

const searchList = (body, request) => {
  let $ = cheerio.load(body);
  return $('.listing tr').not('.head')
    .filter((i, e) => i != 0)
    .map((i, e) => {

      let $info = cheerio.load($(e).find('td[title]').attr('title'));
      let comicId = $info('div a').attr('href').split('/').pop();
      return {
        type: 'comics',
        id: comicId,
        attributes: {
          title: $info('div a').text(),
          summary: $info('div p').text().trim(),
          completed: ($(e).find('td').not('[title]').text().trim() === 'Completed') ? true: false
        },
        links: {
          self: make_url(CONST.ROUTES.comic.detail, { name: comicId }),
          cover: _get_url_img($info('img').attr('src'))
        }
      };
    }).get();
}

const news = (body, request) => {
  let $ = cheerio.load(body);
  let updated =  $('.items>div>a')
    .filter(i => i<10)
    .map((i, e) => {
      let comicId = e.attribs.href.split('/').pop();
      return {
        type: 'comics',
        id: comicId,
        attributes: {
          title: e.children[2].data,
        },
        links: {
          self: make_url(CONST.ROUTES.comic.detail, { name: comicId }),
          cover: _get_url_img(e.children[0].attribs.src  || '')
        }
      }
    }).get();

  // TODO genres available in DOM
  let news =  $('#tab-newest>div')
    .filter(i => i<8)
    .map((i, e) => {
      let comicId = e.children[0].attribs.href.split('/').pop();
      return {
        type: 'comics',
        id: comicId,
        attributes: {
          title: e.children[1].children[0].children[0].data,
        },
        links: {
          self: make_url(CONST.ROUTES.comic.detail, { name: comicId }),
          cover: _get_url_img(e.children[0].children[0].attribs.src  || '')
        }
      }
    }).get();

  return {updated,news}
}

module.exports = {
  details,
  listing,
  issue,
  searchList,
  news
}
