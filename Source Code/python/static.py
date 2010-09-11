#!/usr/bin/env python

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template

class MainHandler(webapp.RequestHandler):
    def get(self):
        request_url = self.request.path
        if request_url.endswith('.html'):
            request_url = request_url[:-5]
        if request_url.endswith('.htm'):
            request_url = request_url[:-4]
        values = {}
        my_response = template.render(''.join(['../html', request_url, '.htm']), values)
        self.response.out.write(my_response)


def main():
    application = webapp.WSGIApplication([('/about', MainHandler), 
                                          ('/instructions', MainHandler)], debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
