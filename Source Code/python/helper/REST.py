import urllib
import logging

from google.appengine.api import urlfetch

from const import Constants

def get(url):
    result = urlfetch.fetch(url)
    if result.status_code == 200:
        return result.content
    else:
        logging.error(result.status_code)
        return None

def getWithArgs(url, args):
    logging.debug("URL: " + url)
    form_data = urllib.urlencode(args)
    logging.debug("args: " + str(form_data))
    result = urlfetch.fetch(url=url,
                            payload=form_data,
                            method=urlfetch.GET,
                            )
    return result.content

def postWithArgs(url, args):
    form_data = urllib.urlencode(args)
    result = urlfetch.fetch(url=url,
                            payload=form_data,
                            method=urlfetch.POST,
                            headers={'Content-Type': 'application/x-www-form-urlencoded'})


def getYelpVenues(lat, lng, term = None):
    logging.debug("getYelpVenues")
    #http://api.yelp.com/business_review_search?term=yelp&tl_lat=37.9&tl_long=-122.5&br_lat=37.788022&br_long=-122.399797&limit=3&ywsid=XXXXXXXXXXXXXXXXXX
    
    #http://api.yelp.com/business_review_search

#http://api.yelp.com/business_review_search?term=yelp&lat=37.788022&long=-122.399797&radius=10&limit=5&ywsid=XXXXXXXXXXXXXXXXXX
    url = 'http://api.yelp.com/business_review_search/'
    args = {
        'limit' : Constants.YELP_LIMIT,
        'lat' : lat,
        'long' : lng,
        'radius' : Constants.YELP_RADIUS,
        'category' : Constants.YELP_CATEGORIES,
        'ywsid' : Constants.YELP_YWSID,
    }
    #http://api.yelp.com/business_review_search?lat=37.788022&long=-122.399797&radius=10&limit=5&ywsid=QvkwilO6TqLRnMAe2qxjkQ

    if (term):
        args['term'] = term
    #data = getWithArgs(url, args)
    url += '?' + urllib.urlencode(args)
    logging.debug(url)
    data = get(url)
    #logging.debug(data)
    return data
