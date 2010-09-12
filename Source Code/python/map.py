#!/usr/bin/env python

import sys
sys.path.append('other')
sys.path.append('facebook')

import facebook
import logging
import os

from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template

import sys
sys.path.append('../other')
from BaseHandler import BaseHandler

""" Handler for mapview
"""
class MapHandler(BaseHandler):
    def get(self):
        #user = self.checkFacebookCredentials()
        #user = None
        user = self.current_user
        self.render(user)

    def render(self, user):
        #values = {'API_KEY': self.API_KEY}
        values = {'API_KEY': 1234}
        #values['LOGGED_IN'] = True
        #values['USER_NAME'] = "John Smith"
        #values['USER_ID'] = 123456
        if user:
            values['LOGGED_IN'] = True
            #values['USER_NAME'] = user['name']
            #values['USER_ID'] = user['uid']
            values['USER_NAME'] = user.name
            values['USER_ID'] = user.id
            #values['USER_NAME'] = "IT WORKED"
            #values['USER_ID'] = 1234
            values['LOGIN_LINK'] = self.createLogoutUrl(self.request.uri)
        else:
            values['LOGGED_IN'] = False
            #values['LOGIN_LINK'] = self.createLoginUrl(self.request.uri)
            values['LOGIN_LINK'] = self.createLoginUrl(self.request.uri)
        if (user):
            logging.debug("Current user: " + str(user))
        else:
            logging.debug("User NULL")
        self.response.out.write(template.render('../html/map.htm', values))
