from flask import Blueprint, request, redirect, render_template, url_for
from flask.views import MethodView
from flask.ext.mongoengine.wtf import model_form
from prototype.models import Concern

concerns = Blueprint('concerns', __name__, template_folder='templates')

class ListView(MethodView):

    form = model_form(Concern, exclude=['created_at'])

    def get_context(self):
        concerns = Concern.objects.all()
        form = self.form(request.form)

        context = {
            "concerns": concerns,
            "form": form
        }

        return context

    def get(self):
        context = self.get_context()
        return render_template('concerns/list.html', **context)

    def post(self):

        context = self.get_context()
        form = context.get('form')

        if form.validate():
            concern = Concern()
            form.populate_obj(concern)
            concern.save()

        context = self.get_context()
        return render_template('concerns/list.html', **context)

# Register the urls
concerns.add_url_rule('/', view_func=ListView.as_view('list'))