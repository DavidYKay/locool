#!/usr/bin/env python

from google.appengine.ext import db

class Venue(db.Model):
    venue_id = db.StringProperty(required=True)
    name = db.StringProperty(required=True)
    address_1 = db.StringProperty()
    address_2 = db.StringProperty()
    address_3 = db.StringProperty()
    image_url = db.StringProperty()
    price = db.IntegerProperty()
    local = db.IntegerProperty()
    lat = db.FloatProperty(required=True)
    lng = db.FloatProperty(required=True)
    location_name = db.StringProperty()
    date_created = db.DateTimeProperty(auto_now_add=True)
    date_modified = db.DateTimeProperty(auto_now_add=True)
