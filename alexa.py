import json
import random
from flask import Flask
from flask_ask import Ask, statement

app = Flask(__name__)
ask = Ask(app, '/')

host = '0.0.0.0'
PORT = 5000

meshi = ['すき家', '松屋', '吉野家']

@ask.intent('Syukkin')
def syukkin(firstname):
    speech_text = 'それはそうと今日の昼はどこにしますか？おすすめは{0}です'.format(random.choice(meshi))
    return statement(speech_text).simple_card('Syukkin', speech_text)

if __name__ == '__main__':
    app.run(host=host, port=PORT)
