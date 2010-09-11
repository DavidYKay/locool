#!/usr/bin/env python

import facebook
import os
import urllib2

from google.appengine.api import users
from google.appengine.ext import webapp

class BaseRequestHandler(webapp.RequestHandler):
    htmlCodes = [
        ['&', '&amp;'],
        ['<', '&lt;'],
        ['>', '&gt;'],
        ['"', '&quot;'],
    ]
    htmlCodesReversed = htmlCodes[:]
    htmlCodesReversed.reverse()

    def htmlDecode(self, s, codes=htmlCodesReversed):
        """ Returns the ASCII decoded version of the given HTML string. This does
            NOT remove normal HTML tags like <p>. It is the inverse of htmlEncode()."""
        for code in codes:
            s = s.replace(code[1], code[0])
        return s

    def checkFacebookCredentials(self):
        if os.environ['SERVER_SOFTWARE'].startswith('Development'):
            API_KEY = '82d03be712b2773aa7cc3774195e125e'
            SECRET_KEY = '06aa97dd6904eba7781307922abd5aff'
        else:
            API_KEY = '82d03be712b2773aa7cc3774195e125e'
            SECRET_KEY = '06aa97dd6904eba7781307922abd5aff'
        self.facebookapi = facebook.Facebook(API_KEY, SECRET_KEY)
        if not self.facebookapi.check_connect_session(self.request):
            return None
        try:
            user = self.facebookapi.users.getInfo(
                [self.facebookapi.uid],
                ['uid', 'name'])[0]
            return user
        except facebook.FacebookError:
            return None

    def createLoginUrl(self, url):
        return 'login?redirect=' + urllib2.quote(url)

    def checkAllCredentials(self, callback, check_facebook=True):
        user = users.get_current_user()
        if user:
            if check_facebook:
                if os.environ['SERVER_SOFTWARE'].startswith('Development'):
                    user = {}
                    user['name'] = 'John Doe'
                    user['uid'] = 123456789
                else:
                    user = self.checkFacebookCredentials()
                if user:
                    callback(user)
                else:
                    self.response.out.write('{"result":"ERROR", "code": "300", "message":"not logged in"}')
            else:
                callback(user)
        else:
            self.response.out.write('{"result":"ERROR", "code": "300", "message":"not logged in"}')
        