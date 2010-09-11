#!/usr/bin/env python

import sys
sys.path.append('other')
sys.path.append('facebook')

import facebook
import logging
import os

#from BaseRequestHandler import BaseRequestHandler
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template

import sys
sys.path.append('../other')
from BaseHandler import BaseHandler

class MapHandler(BaseHandler):
    def get(self):
        #user = self.checkFacebookCredentials()
        user = None
        self.render(user)

    def render(self, user):
        #values = {'API_KEY': self.API_KEY}
        values = {'API_KEY': 1234}
        #if user:
        #    values['LOGGED_IN'] = True
        #    values['USER_NAME'] = user['name']
        #    values['USER_ID'] = user['uid']
        #else:
        #    values['LOGGED_IN'] = False
        #    values['LOGIN_LINK'] = self.createLoginUrl(self.request.uri)
        values['LOGGED_IN'] = True
        values['USER_NAME'] = "John Smith"
        values['USER_ID'] = 123456
        self.response.out.write(template.render('../html/map.htm', values))
        #self.response.out.write(template.render('../html/map.htm'))

#def main():
#    logging.getLogger().setLevel(logging.DEBUG)
#    application = webapp.WSGIApplication([('/', MainHandler)], debug=True)
#    util.run_wsgi_app(application)
#
#
#if __name__ == '__main__':
#    main()

