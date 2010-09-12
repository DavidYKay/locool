import urllib2
import logging
import pprint

from google.appengine.ext import webapp
from model import User
import functions

""" Superclass to all event handlers
"""
class BaseHandler(webapp.RequestHandler):
    """ Grab the user from the cookie """
    @property
    def current_user(self):
        """Returns the logged in Facebook user, or None if unconnected."""
        if not hasattr(self, "_current_user"):
            self._current_user = None
            user_id = functions.parse_cookie(self.request.cookies.get("fb_user"))
            if user_id:
                self._current_user = User.get_by_key_name(user_id)
                logging.debug("Current User: ")
                pp = pprint.PrettyPrinter(indent=2)
                #pp.pprint(self._current_user)
                logging.debug(pp.pformat(self._current_user))
        return self._current_user

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

    def createLoginUrl(self, url):
            return 'auth/login'
            #return 'login?redirect=' + urllib2.quote(url)
    def createLogoutUrl(self, url):
            return 'auth/logout'
        #return "<a href='/auth/login'>Log in with Facebook</a>"


