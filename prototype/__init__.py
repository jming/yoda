from flask import Flask
from flask.ext.mongoengine import MongoEngine

app = Flask(__name__)
app.config["MONGODB_SETTINGS"] = {'DB': "my_concerns"}
app.config["SECRET_KEY"] = "secretkey"

db = MongoEngine(app)

def register_blueprints(app):
    # Prevents circular imports
    from prototype.views import concerns
    app.register_blueprint(concerns)

register_blueprints(app)

if __name__ == '__main__':
    app.run()