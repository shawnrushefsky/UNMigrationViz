import cherrypy
import os
import simplejson as json

path = os.path.dirname(os.path.abspath(__file__))


class App(object):
    def __init__(self):
        self.exposed = True

if __name__ == "__main__":
    # print "Loading Data..."
    # with open(os.path.join(path, "data", "MigrationGraph.json"), "r") as f:
    #     g = json.load(f)
    cherrypy.config.update(os.path.join(path, "config", "server.conf"))
    cherrypy.tree.mount(App(), "/", {
        "/": {
            "tools.staticdir.on": True,
            "tools.staticdir.root": os.path.join(path, "web"),
            "tools.staticdir.dir": "",
            "tools.staticdir.index": "index.html"
        }})
    cherrypy.engine.start()
    cherrypy.engine.block()