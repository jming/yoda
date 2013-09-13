import datetime
from flask import url_for
from prototype import db


class Concern(db.Document):
    created_at = db.DateTimeField(default=datetime.datetime.now, required=True)
    text = db.StringField(max_length=255, required=True)

    def __unicode__(self):
        return self.text