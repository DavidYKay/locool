#!/usr/bin/env python

from google.appengine.ext import db

class Yelp(db.Model):
    venue_id = db.StringProperty(required=True)
    url = db.StringProperty(required=True)
    html = db.BlobProperty()
    date_created = db.DateTimeProperty(auto_now_add=True)
    date_modified = db.DateTimeProperty(auto_now_add=True)
