import urllib2
import logging

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
