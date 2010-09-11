import hmac
import urllib2
import hashlib
import time
import logging
import base64
import pprint

from google.appengine.ext import webapp
from model import User

""" Superclass to all event handlers
"""
class BaseHandler(webapp.RequestHandler):
    FACEBOOK_APP_ID     = '82d03be712b2773aa7cc3774195e125e'
    FACEBOOK_APP_SECRET = '06aa97dd6904eba7781307922abd5aff'
    """ Grab the user from the cookie """
    @property
    def current_user(self):
        """Returns the logged in Facebook user, or None if unconnected."""
        if not hasattr(self, "_current_user"):
            self._current_user = None
            user_id = parse_cookie(self.request.cookies.get("fb_user"))
            if user_id:
                self._current_user = User.get_by_key_name(user_id)
                logging.debug("Current User: ")
                pp = pprint.PrettyPrinter(indent=2)
                pp.pprint(self._current_user)
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
            #return 'login?redirect=' + urllib2.quote(url)
            return 'auth/login'
        #return "<a href='/auth/login'>Log in with Facebook</a>"

""" Cookie utility functions
"""
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
    hash = hmac.new(BaseHandler.FACEBOOK_APP_SECRET, digestmod=hashlib.sha1)
    for part in parts: hash.update(part)
    return hash.hexdigest()

