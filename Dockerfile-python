FROM python:3.6.5

# Specify charset
ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8

# Upgrade pip and install pipenv
RUN pip install pip==9.0.0 && pip install pipenv 

RUN mkdir -p /app
WORKDIR /app

# Install pip dependencies
ADD ./Pipfile ./Pipfile.lock /app/
RUN pipenv install -d

# Load rest of files
ADD . /app/

# Collect static files
CMD pipenv run python alexa.py 

