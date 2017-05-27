# Visualizing UN Migration Data, 1990-2015
The goal of this project is to produce a responsive, mobile-ready web application for visualizing UN Migration Data from 1990-2015. You can see it [running live.](http://cogitam.us)

I've included the original data files I used, but you can also find them hosted by the UN [here](https://www.un.org/en/development/desa/population/migration/data/estimates2/estimates15.shtml): [Migrant Stock Total](https://www.un.org/en/development/desa/population/migration/data/estimates2/data/UN_MigrantStockTotal_2015.xlsx), [Migrant Stock by Origin and Destination](https://www.un.org/en/development/desa/population/migration/data/estimates2/data/UN_MigrantStockByOriginAndDestination_2015.xlsx)

I used open map data from [Natural Earth Data](http://www.naturalearthdata.com/downloads), and converted the shape file to geojson with [QGIS](http://www.qgis.org/).

I'm using [d3.js](https://d3js.org/) to correlate my dataset with svg elements on the page, and [Ubuntu](https://www.ubuntu.com/)/[CherryPy](http://cherrypy.org/) for a web server.

A brief python script `parse.py` extrapolates the migration graph from the UN datasets. The graph is stored as adjacency dictionary, so that it would be easy to reference nodes (countries) by their name, and easy to export in json.

A second python script `stitch.py` associates the graph data from `parse.py` with the geojson file that describes the shape of each country, yielding a unified data file for use in the web application.

Autocomplete for the search field is implemented in pure javascript in `app.js`.

The favicon was made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a>
