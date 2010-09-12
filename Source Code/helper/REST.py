import urllib2
import logging
from google.appengine.api import urlfetch

def googleGet(url):
    url = "http://www.google.com/"
    result = urlfetch.fetch(url)
    if result.status_code == 200:
        #doSomethingWithResult(result.content)
        return result.content
    else:
        return None

def get(url):
    logging.debug("Began get: " + url)
    try:
        data = urllib2.urlopen(url).read()
    except urllib2.HTTPError, e:
        logging.error("HTTP error: %d" % e.code)
    except urllib2.URLError, e:
        logging.error("Network error: %s" % e.reason.args[1])
    return data

class OpenGraph:
    def get(url):
        logging.debug("Began get: " + url)
        try:
            data = urllib2.urlopen(url).read()
        except urllib2.HTTPError, e:
            logging.error("HTTP error: %d" % e.code)
        except urllib2.URLError, e:
            logging.error("Network error: %s" % e.reason.args[1])
        return data
