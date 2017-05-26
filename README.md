# UNMigrationViz
The goal of this project is to produce a responsive, mobile-ready web application for visualizing UN Migration Data from 1990-2015. You can see it [running live.](cogitam.usht

I've included the original data files I used, but you can also find them hosted by the UN here:
https://www.un.org/en/development/desa/population/migration/data/estimates2/estimates15.shtml
https://www.un.org/en/development/desa/population/migration/data/estimates2/data/UN_MigrantStockTotal_2015.xlsx
https://www.un.org/en/development/desa/population/migration/data/estimates2/data/UN_MigrantStockByOriginAndDestination_2015.xlsx

I used open map data from [Natural Earth Data](http://www.naturalearthdata.com/downloads), and converted the shape file to geojson with [QGIS](http://www.qgis.org/).

I'm using [d3.js](https://d3js.org/) to correlate my dataset with svg elements on the page, and [CherryPy](http://cherrypy.org/) for a web server.

I wrote a brief python script `parse.py` to extrapolate the migration graph from the UN datasets. I opted for an adjacency dictionary to store the graph, so that it would be easy to reference nodes (countries) by their name.

A second python script `stitch.py` associates the graph data from `parse.py` with the geojson file that describes the shape of each country, yielding a unified data file for use in the web application.


My favicon was made by <a href="http://www.freepik.com" title="Freepik">Freepik</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a>





