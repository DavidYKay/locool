#!/usr/bin/env python

import sys
sys.path.append('other')
sys.path.append('facebook')

import facebook
import logging
import os

#from BaseRequestHandler import BaseRequestHandler
from main import BaseHandler
from django.utils import simplejson
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template

class MainHandler(BaseRequestHandler):
    def get(self):
        self.render()

    def render(self):
        req_lat = self.request.get("lat", default_value="40.73")
        req_lng = self.request.get("lng", default_value="-73.99")
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
        json_result['venues'] = venues
        my_response = simplejson.dumps(json_result)
        self.response.out.write(my_response)


def main():
    application = webapp.WSGIApplication([('/venues', MainHandler)], debug=True)
    util.run_wsgi_app(application)


if __name__ == '__main__':
    main()
