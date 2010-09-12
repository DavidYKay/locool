#!/usr/bin/env python

import sys
sys.path.append('other')
sys.path.append('facebook')

import facebook
import logging
import os
import urllib

#from BaseHandler import BaseHandler
from main import BaseHandler
from django.utils import simplejson
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from time import strftime

class MainHandler(BaseHandler):
    def get(self):
        self.render()

    def render(self):
        req_lat = self.request.get("lat", default_value='40.73')
        req_lng = self.request.get("lng", default_value='-73.99')
        req_where = self.request.get("where", default_value='New York, NY')
        req_when = self.request.get("when", default_value=strftime('%m/%d/%Y'))
        req_local_meter = self.request.get("local", default_value='3')
        req_friend_print = self.request.get("social", default_value='3')
        req_popularity = self.request.get("popularity", default_value='3')
        req_price = self.request.get("price", default_value='3')
        req_time_of_day = self.request.get("timeofday", default_value='3')
        
        req_where = urllib.unquote(req_where);
        req_when = urllib.unquote(req_when);
        req_local_meter = urllib.unquote(req_local_meter);
        req_friend_print = urllib.unquote(req_friend_print);
        req_popularity = urllib.unquote(req_popularity);
        req_price = urllib.unquote(req_price);
        req_time_of_day = urllib.unquote(req_time_of_day);
        
        logging.error('req_lat: ' + str(req_lat))
        logging.error('req_lng: ' + str(req_lng))
        logging.error('req_where: ' + str(req_where))
        logging.error('req_when: ' + str(req_when))
        logging.error('req_local_meter: ' + str(req_local_meter))
        logging.error('req_friend_print: ' + str(req_friend_print))
        logging.error('req_popularity: ' + str(req_popularity))
        logging.error('req_price: ' + str(req_price))
        logging.error('req_time_of_day: ' + str(req_time_of_day))

        json_result = {}
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
        json_result['venues'] = venues
        my_response = simplejson.dumps(json_result)
        self.response.out.write(my_response)


def main():
    application = webapp.WSGIApplication([('/venues', MainHandler)], debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
