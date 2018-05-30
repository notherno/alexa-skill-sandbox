import json
from flask import Flask
from flask_ask import Ask, statement

app = Flask(__name__)
ask = Ask(app, '/')

@ask.intent('Syukkin')
def syukkin(firstname):
    speech_text = "ステータスを出勤にしました"
    return statement(speech_text).simple_card('Syukkin', speech_text)

if __name__ == '__main__':
    app.run(port=8000)
