#!/usr/bin/env python

import sys
sys.path.append('other')
sys.path.append('facebook')

import facebook
import logging
import os

from BaseRequestHandler import BaseRequestHandler
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template

class MainHandler(BaseRequestHandler):
    def get(self):
            user = self.checkFacebookCredentials()
            self.render(user)

    def render(self, user):
        values = {'API_KEY': self.API_KEY}
        if user:
            values['LOGGED_IN'] = True
            values['USER_NAME'] = user['name']
            values['USER_ID'] = user['uid']
        else:
            values['LOGGED_IN'] = False
            values['LOGIN_LINK'] = self.createLoginUrl(self.request.uri)
        request_url = self.request.path
        if request_url.endswith('.html'):
            request_url = request_url[:-5]
        if request_url.endswith('.htm'):
            request_url = request_url[:-4]
        my_response = template.render(''.join(['../html', request_url, '.htm']), values)
        self.response.out.write(my_response)


def main():
    application = webapp.WSGIApplication( [
        ('/about', MainHandler), 
        ('/instructions', MainHandler)
    ], debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
