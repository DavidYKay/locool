#!/usr/bin/env python

import sys
sys.path.append('other')
sys.path.append('facebook')
sys.path.append('helper')

import re
import math
import logging
import os
import urllib
import simplejson
import facebook

from BeautifulSoup import BeautifulSoup

from BaseHandler import BaseHandler
# from main import BaseHandler
from django.utils import simplejson
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from time import strftime
from const import Constants
#from helper import REST
import REST

class VenuesHandler(BaseHandler):
    def get(self):
        self.render()

    def render(self):
        self.req = {}
        self.req['lat'] = self.request.get("lat", default_value='40.73')
        self.req['lng'] = self.request.get("lng", default_value='-73.99')
        self.req['where'] = self.request.get("where", default_value='New York, NY')
        self.req['when'] = self.request.get("when", default_value=strftime('%m/%d/%Y'))
        self.req['local_meter'] = self.request.get("local", default_value='3')
        self.req['friend_print'] = self.request.get("social", default_value='3')
        self.req['popularity'] = self.request.get("popularity", default_value='3')
        self.req['price'] = self.request.get("price", default_value='3')
        self.req['time_of_day'] = self.request.get("timeofday", default_value='3')

        #req_lat = self.request.get("lat", default_value='40.73')
        #req_lng = self.request.get("lng", default_value='-73.99')
        #req_where = self.request.get("where")
        #req_when = self.request.get("when", default_value=strftime('%m/%d/%Y'))
        #req_local_meter = self.request.get("local", default_value='3')
        #req_friend_print = self.request.get("social", default_value='3')
        #req_popularity = self.request.get("popularity", default_value='3')
        #req_price = self.request.get("price", default_value='3')
        #req_time_of_day = self.request.get("timeofday", default_value='3')
        
        self.req['where'] = urllib.unquote(self.req['where']);
        self.req['when'] = urllib.unquote(self.req['when']);
        self.req['local_meter'] = urllib.unquote(self.req['local_meter']);
        self.req['friend_print'] = urllib.unquote(self.req['friend_print']);
        self.req['popularity'] = urllib.unquote(self.req['popularity']);
        self.req['price'] = urllib.unquote(self.req['price']);
        self.req['time_of_day'] = urllib.unquote(self.req['time_of_day']);
        
        #logging.error('req_lat: ' + str(req['lat']))
        #logging.error('req_lng: ' + str(req['lng']))
        #logging.error('req_where: ' + str(req['where']))
        #logging.error('req_when: ' + str(req_when))
        #logging.error('req_local_meter: ' + str(req_local_meter))
        #logging.error('req_friend_print: ' + str(req_friend_print))
        #logging.error('req_popularity: ' + str(req_popularity))
        #logging.error('req_price: ' + str(req_price))
        #logging.error('req_time_of_day: ' + str(req_time_of_day))

        #data = REST.getYelpVenues(self.req['lat'], self.req['lng'])
        data = REST.getYelpVenues(self.req['lat'], self.req['lng'], self.req['where'])
        #data = REST.getYelpVenues(req_lat, req_lng, req_where)
        jsonData = simplejson.loads(data)
        venues = self.prepYelpData(jsonData)

        json_result = {}
        json_result['venues'] = venues
        my_response = simplejson.dumps(json_result)
        self.response.out.write(my_response)

    def prepYelpData(self, data):
        businesses = data['businesses']
        trimmedBiz = []
        for business in businesses:
            newBiz = {}
            newBiz['name'] = business['name']
            newBiz['venue_id'] = business['id']
            newBiz['image_url'] = business['photo_url']
            newBiz['lat'] = business['latitude']
            newBiz['lng'] = business['longitude']
            newBiz['address1'] = business['address1']
            newBiz['address2'] = business['address2']
            newBiz['address3'] = '%s, %s %s' % ( business['city'], business['state'], business['zip'])

            #scrape html
            soup = self.getSoup(business)
            dollars = self.getDollarSigns(soup)
            touristScore = self.getTouristScore(soup)

            newBiz['price'] = dollars
            newBiz['local'] = touristScore

            trimmedBiz.append(newBiz)

            #if (dollars == self.req['price']):
            #if (str(dollars) == str(self.req['price'])):

            #idealPrice = int(self.req['price'])
            #idealLocal = int(self.req['local_meter'])
            
            #if (math.fabs(dollars - idealPrice) < 2):
            #    #if (math.fabs(touristScore - self.req['local_meter']) < 2):
            #    if (math.fabs(touristScore - idealLocal) < 2):
            #        #newBiz['dollars'] = dollars
            #        trimmedBiz.append(newBiz)
            #    else:
            #        logging.debug(str(" missed tourist score " + self.req['local_meter']))
            #else:
            #    logging.debug(str(" missed price " + self.req['price']))
            #    #logging.error(str(self.req['price']) " + "Didn't match " + str(dollars))
        return trimmedBiz

    def getSoup(self, business):
        url = business['url']
        if (url == None):
            logging.error(business['name'] + " No URL!")
            return 0
        html = REST.get(url)
        soup = BeautifulSoup(''.join(html))
        return soup

    def getDollarSigns(self, soup):
        match = soup(id="price_tip")[0].contents[0]
        return len(match)
    
    def getTouristScore(self, soup):
        """ Crawl Yelp Page, check review cities. Reverse-geocode, then compare """
        """
        reviewer_info
        second node
        """
        #firstPTag, secondPTag = soup.findAll('p')
        #reviewerInfoNodes = soup.findAll('reviewer_info')
        #for i in range(0, len(reviewerInfoNodes) - 1):

        return 2
    
    def makeFakeListings(self):
        venues = []
        venue = {'lat': 40.73, 
                 'lng': -73.99, 
                 'name': 'Joe\'s Pizza', 
                 'venue_id': '1029384', 
                 'address1': '520 Broadway', 
                 'address3': 'New York, NY 10012'}
        venues.append(venue)
        venue = {'lat': 40.7318, 
                 'lng': -73.99, 
                 'name': 'Pando, Inc.', 
                 'venue_id': '1029385', 
                 'address1': '520 Broadway', 
                 'address2': '10th Floor', 
                 'address3': 'New York, NY 10012'}
        venues.append(venue)
        venue = {'lat': 40.733, 
                 'lng': -73.999, 
                 'name': 'New Work City', 
                 'venue_id': '1029386', 
                 'address1': '412 Broadway', 
                 'address2': '2nd Floor', 
                 'address3': 'New York, NY 10012'}
        venues.append(venue)
        venue = {'lat': 40.739, 
                 'lng': -73.991, 
                 'name': 'Gap, Inc.', 
                 'venue_id': '1029387', 
                 'address1': '524 Broadway', 
                 'address3': 'New York, NY 10012'}
        venues.append(venue)
        venue = {'lat': 40.731, 
                  'lng': -73.992, 
                  'name': 'Dean &amp; Deluca', 
                  'venue_id': '1029380', 
                  'address1': '524 Broadway', 
                  'address3': 'New York, NY 10012'}
        venues.append(venue)
        venue = {'lat': 40.731, 
                   'lng': -73.994, 
                   'name': 'Gatby\'s', 
                   'venue_id': '1029388', 
                   'address1': '524 Broadway', 
                   'address3': 'New York, NY 10012'}
        venues.append(venue)
        venue = {'lat': 40.738, 
                   'lng': -73.992, 
                   'name': 'Firefly', 
                   'venue_id': '1029389', 
                   'address1': '524 Broadway', 
                   'address3': 'New York, NY 10012'}
        venues.append(venue)
        venue = {'lat': 40.736, 
                   'lng': -73.993, 
                   'name': 'Cafe Duke', 
                   'venue_id': '1029390', 
                   'address1': '524 Broadway', 
                   'address3': 'New York, NY 10012'}
        venues.append(venue)
        venue = {'lat': 40.735, 
                   'lng': -73.995, 
                   'name': 'D &amp; D Deli', 
                   'venue_id': '1029391', 
                   'address1': '524 Broadway', 
                   'address3': 'New York, NY 10012'}
        venues.append(venue)
        venue = {'lat': 40.734, 
                   'lng': -73.997, 
                   'name': 'Carpet Store, Inc.', 
                   'venue_id': '1029392', 
                   'address1': '524 Broadway', 
                   'address3': 'New York, NY 10012'}
        venues.append(venue)
        return venues

