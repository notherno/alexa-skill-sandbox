import os
import json
import random
from flask import Flask
from flask_ask import Ask, statement
from urllib import parse
import MySQLdb

app = Flask(__name__)
ask = Ask(app, '/')

host = '0.0.0.0'
PORT = 5000

parsed_config = parse.urlparse(os.environ.get('DATABASE_URL'))

@ask.intent('Syukkin')
def syukkin(firstname):
    with MySQLdb.connect(
        user=parsed_config.username,
        passwd=parsed_config.password,
        host=parsed_config.hostname,
        db=parsed_config.path[1:],
        charset='utf8'
    ) as cur:
        cur.execute('SELECT `name` FROM `restaurants`')

        rows = cur.fetchall()

        choice = random.choice([row[0] for row in rows])

    speech_text = 'おすすめは{0}です'.format(choice)

    return statement(speech_text).simple_card('Syukkin', speech_text)

if __name__ == '__main__':
    app.run(host=host, port=PORT)
