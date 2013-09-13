from flask import Blueprint, request, redirect, render_template, url_for
from flask.views import MethodView
from flask.ext.mongoengine.wtf import model_form
from prototype.models import Concern

concerns = Blueprint('concerns', __name__, template_folder='templates')

class ListView(MethodView):

    # form = model_form(Concern)

    def get(self):
        concerns = Concern.objects.all()
        return render_template('concerns/list.html', concerns=concerns)

# Register the urls
concerns.add_url_rule('/', view_func=ListView.as_view('list'))