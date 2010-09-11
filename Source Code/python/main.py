#!/usr/bin/env python
#
# Copyright 2010 Facebook
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.

"""A barebones AppEngine application that uses Facebook for login.

This application uses OAuth 2.0 directly rather than relying on Facebook's
JavaScript SDK for login. It also accesses the Facebook Graph API directly
rather than using the Python SDK. It is designed to illustrate how easy
it is to use the Facebook Platform without any third party code.

See the "appengine" directory for an example using the JavaScript SDK.
Using JavaScript is recommended if it is feasible for your application,
as it handles some complex authentication states that can only be detected
in client-side code.
"""

FACEBOOK_APP_ID     = '82d03be712b2773aa7cc3774195e125e'
FACEBOOK_APP_SECRET = '06aa97dd6904eba7781307922abd5aff'

import base64
import cgi
import Cookie
import email.utils
import hashlib
import hmac
import logging
import os.path
import time
import urllib
import wsgiref.handlers

from django.utils import simplejson as json
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template

import sys
sys.path.append('.')
sys.path.append('other')
from BaseHandler import BaseHandler
from map import MapHandler

class User(db.Model):
    id = db.StringProperty(required=True)
    created = db.DateTimeProperty(auto_now_add=True)
    updated = db.DateTimeProperty(auto_now=True)
    name = db.StringProperty(required=True)
    profile_url = db.StringProperty(required=True)
    access_token = db.StringProperty(required=True)



class HomeHandler(BaseHandler):
    def get(self):
        path = os.path.join(os.path.dirname(__file__), "../html/oauth.html")
        args = dict(current_user=self.current_user)
        self.response.out.write(template.render(path, args))

class LoginHandler(BaseHandler):
    def get(self):
        verification_code = self.request.get("code")
        args = dict(client_id=FACEBOOK_APP_ID, redirect_uri=self.request.path_url)
        if self.request.get("code"):
            args["client_secret"] = FACEBOOK_APP_SECRET
            args["code"] = self.request.get("code")
            response = cgi.parse_qs(urllib.urlopen(
                "https://graph.facebook.com/oauth/access_token?" +
                urllib.urlencode(args)).read())
            access_token = response["access_token"][-1]

            # Download the user profile and cache a local instance of the
            # basic profile info
            profile = json.load(urllib.urlopen(
                "https://graph.facebook.com/me?" +
                urllib.urlencode(dict(access_token=access_token))))
            user = User(key_name=str(profile["id"]), id=str(profile["id"]),
                        name=profile["name"], access_token=access_token,
                        profile_url=profile["link"])
            user.put()
            set_cookie(self.response, "fb_user", str(profile["id"]),
                       expires=time.time() + 30 * 86400)
            self.redirect("/")
        else:
            self.redirect(
                "https://graph.facebook.com/oauth/authorize?" +
                urllib.urlencode(args))


class LogoutHandler(BaseHandler):
    def get(self):
        set_cookie(self.response, "fb_user", "", expires=time.time() - 86400)
        self.redirect("/")


def set_cookie(response, name, value, domain=None, path="/", expires=None):
    """Generates and signs a cookie for the give name/value"""
    timestamp = str(int(time.time()))
    value = base64.b64encode(value)
    signature = cookie_signature(value, timestamp)
    cookie = Cookie.BaseCookie()
    cookie[name] = "|".join([value, timestamp, signature])
    cookie[name]["path"] = path
    if domain: cookie[name]["domain"] = domain
    if expires:
        cookie[name]["expires"] = email.utils.formatdate(
            expires, localtime=False, usegmt=True)
    response.headers._headers.append(("Set-Cookie", cookie.output()[12:]))


def parse_cookie(value):
    """Parses and verifies a cookie value from set_cookie"""
    if not value: return None
    parts = value.split("|")
    if len(parts) != 3: return None
    if cookie_signature(parts[0], parts[1]) != parts[2]:
        logging.warning("Invalid cookie signature %r", value)
        return None
    timestamp = int(parts[1])
    if timestamp < time.time() - 30 * 86400:
        logging.warning("Expired cookie %r", value)
        return None
    try:
        return base64.b64decode(parts[0]).strip()
    except:
        return None


def cookie_signature(*parts):
    """Generates a cookie signature.

    We use the Facebook app secret since it is different for every app (so
    people using this example don't accidentally all use the same secret).
    """
    hash = hmac.new(FACEBOOK_APP_SECRET, digestmod=hashlib.sha1)
    for part in parts: hash.update(part)
    return hash.hexdigest()


""" Handles all of the Static Content Pages
"""
#class StaticHandler(BaseRequestHandler):
class StaticHandler(BaseHandler):
    def get(self):
            #user = self.checkFacebookCredentials()
            user = None
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
    util.run_wsgi_app(webapp.WSGIApplication([
        (r"/", MapHandler),
        (r"/home", HomeHandler),
        (r"/auth/login", LoginHandler),
        (r"/auth/logout", LogoutHandler),
        ('/about', StaticHandler), 
        ('/instructions', StaticHandler),
    ]))

if __name__ == "__main__":
    main()

