from google.appengine.ext import webapp

class BaseHandler(webapp.RequestHandler):
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


    @property
    def current_user(self):
        """Returns the logged in Facebook user, or None if unconnected."""
        if not hasattr(self, "_current_user"):
            self._current_user = None
            user_id = parse_cookie(self.request.cookies.get("fb_user"))
            if user_id:
                self._current_user = User.get_by_key_name(user_id)
        return self._current_user

