'use strict';

// TODO remove promises from here
var cheerio = require('cheerio');
var make_url = require('./make_url');
var CONST = require('../constants');

var _get_url_last_part = function _get_url_last_part(url) {
  return url.replace(/^.*?\/([^\/]+?)(\?.+)?$/, '$1').toLowerCase();
};
// TODO make domain dynamic
var _get_url_img = function _get_url_img(url) {
  return url.replace(CONST.SOURCE_URL, 'http://localhost:8080/img/');
};

var _get_linked_data = function _get_linked_data($data, type) {
  var id = _get_url_last_part($data.attr('href'));

  return {
    type: type,
    id: id,
    attributes: {
      name: $data.text()
    },
    links: {
      self: make_url('/' + type + '/' + id)
    }
  };
};

var _get_person_data = function _get_person_data($data, type) {
  var id = _get_url_last_part($data.attr('href'));
  var name = $data.text().split(' ');

  return {
    type: type,
    id: id,
    attributes: {
      first_name: name[0],
      last_name: name[name.length - 1]
    },
    links: {
      self: make_url('/' + type + '/' + id)
    }
  };
};

var details = function details(body, request) {
  var p = new Promise(function (resolve, reject) {
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
        links: {}
      },
      included: [],
      links: []
    };

    $data.find('p').each(function (index, item) {
      var $item = $(item);
      var info_name = $item.find('.info:first-child').text().replace(/:/, '');

      switch (info_name) {
        case 'Genres':
          $item.find('a').each(function (_, genre) {
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

    $('.listing').find('tr').each(function (index, item) {
      var $item = $(item);

      if ($item.find('a').length > 0) {
        var title = $item.find('a').text().trim();
        var issue_id = _get_url_last_part($item.find('a').attr('href'));
        var url = make_url(CONST.ROUTES.comic.issue, { name: json_data.data.id, issue: issue_id });
        var release_day = $item.find('td:last-child').text().trim();
        var issue = {
          id: json_data.data.id + '-' + issue_id,
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
var listing = function listing(body, request) {
  var $ = cheerio.load(body);
  var params = request.params;
  var all_comics = [];
  var $all_rows = $('table.listing').find('tr');
  var $pager = $('.pagination').find('.pager');
  var letter_link_part = !!params.letter ? '/' + params.letter : '';
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
    } else {
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

  $all_rows.each(function (index, item) {
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

  return new Promise(function (resolve, reject) {
    resolve({
      links: links,
      data: all_comics_with_covers
    });
  });
};

var issue = function issue(body, request) {
  var json_data = {
    data: {
      type: 'issues',
      id: request.params.name + '-' + request.params.issue,
      attributes: {
        pages: []
      }
    }
  };

  var lines = body.split("\n");

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = lines[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var line = _step.value;

      var match = line.match(/lstImages\.push\(["'](.*?)["']\);/i);

      if (!!match) {
        json_data.data.attributes.pages.push(match[1]);
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  ;

  var p = Promise.resolve(json_data);
  p.__name = 'Comic issue';
  return p;
};

var searchList = function searchList(body, request) {
  var $ = cheerio.load(body);
  return $('.listing tr').not('.head').filter(function (i, e) {
    return i != 0;
  }).map(function (i, e) {

    var $info = cheerio.load($(e).find('td[title]').attr('title'));
    var comicId = $info('div a').attr('href').split('/').pop();
    return {
      type: 'comics',
      id: comicId,
      attributes: {
        title: $info('div a').text(),
        summary: $info('div p').text().trim(),
        completed: $(e).find('td').not('[title]').text().trim() === 'Completed' ? true : false
      },
      links: {
        self: make_url(CONST.ROUTES.comic.detail, { name: comicId }),
        cover: _get_url_img($info('img').attr('src'))
      }
    };
  }).get();
};

var news = function news(body, request) {
  var $ = cheerio.load(body);
  var updated = $('.items>div>a').filter(function (i) {
    return i < 10;
  }).map(function (i, e) {
    var comicId = e.attribs.href.split('/').pop();
    return {
      type: 'comics',
      id: comicId,
      attributes: {
        title: e.children[2].data
      },
      links: {
        self: make_url(CONST.ROUTES.comic.detail, { name: comicId }),
        cover: _get_url_img(e.children[0].attribs.src || '')
      }
    };
  }).get();

  // TODO genres available in DOM
  var news = $('#tab-newest>div').filter(function (i) {
    return i < 8;
  }).map(function (i, e) {
    var comicId = e.children[0].attribs.href.split('/').pop();
    return {
      type: 'comics',
      id: comicId,
      attributes: {
        title: e.children[1].children[0].children[0].data
      },
      links: {
        self: make_url(CONST.ROUTES.comic.detail, { name: comicId }),
        cover: _get_url_img(e.children[0].children[0].attribs.src || '')
      }
    };
  }).get();

  return { updated: updated, news: news };
};

module.exports = {
  details: details,
  listing: listing,
  issue: issue,
  searchList: searchList,
  news: news
};