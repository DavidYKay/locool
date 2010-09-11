#!/usr/bin/env python

import sys
sys.path.append('facebook')

import facebook
import os

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template

class MainHandler(webapp.RequestHandler):
    def get(self):
        user = users.get_current_user()
        if user:
            self.render()
        else:
            self.redirect(users.create_login_url(self.request.uri))

    def render(self):
        if os.environ['SERVER_SOFTWARE'].startswith('Development'):
            self.API_KEY = '56645e5032228b6596da9b3678509f9b'
        else:
            self.API_KEY = '58dc73c9e414a926bc46307144b2661c'
        my_response = template.render('../html/login.htm', {
            'API_KEY': self.API_KEY,
            'HIDE_MENU': True,
            'ON_LOGIN_URL': self.request.get('redirect')
        })
        self.response.out.write(my_response)


def main():
    application = webapp.WSGIApplication([('/login', MainHandler)], debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
