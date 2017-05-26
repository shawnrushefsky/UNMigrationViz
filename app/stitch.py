# coding: utf-8
import os
import simplejson as json
import pprint

pp = pprint.PrettyPrinter(indent=4)

path = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(path, "data", "MigrationGraph.json"), "r") as f1:
    g = json.load(f1)
    with open(os.path.join(path, "data", "countries.geojson"), "r") as f2:
        world = json.load(f2)
        for n in world['features']:
            cn = n['properties']['name']
            to_skip = ["Antarctica", "Siachen Glacier"]
            if cn in to_skip:
                continue
            swaps = {
                "Bolivia": "Bolivia (Plurinational State of)",
                "Cte d'Ivoire": u"Côte d'Ivoire",
                "Cape Verde": "Cabo Verde",
                "N. Cyprus": "Cyprus",
                "Falkland Is.": "Falkland Islands (Malvinas)",
                "Micronesia": "Micronesia (Federated States of)",
                "Iran": "Iran (Islamic Republic of)",
                "Kosovo": "Serbia",
                "Macedonia": "The former Yugoslav Republic of Macedonia",
                "Somaliland": "Somalia",
                "Br. Indian Ocean Ter.": "United Kingdom of Great Britain and Northern Ireland",
                "Pitcairn Is.": "United Kingdom of Great Britain and Northern Ireland",
                "S. Geo. and S. Sandw. Is.": "United Kingdom of Great Britain and Northern Ireland",
                "Taiwan": "China",
                "Vatican": "Holy See",
                "Venezuela": "Venezuela (Bolivarian Republic of)",
                "Vietnam": "Viet Nam"
            }
            if cn in swaps:
                cn = swaps[cn]
            if cn not in g:
                cn = n['properties']['name_long']
                if cn not in g:
                    cn = n['properties']['formal_en']
                    if cn not in g:
                        cn = n['properties']['sovereignt']
                        if cn not in g:
                            cn = n['properties']['brk_group']
            try:
                n['properties']['graph'] = g[cn]
                n['properties']['graph']['label'] = cn
            except:
                pp.pprint(n['properties'])
                break
        with open(os.path.join(path, "web", "json", "CountryData.geojson"), "w") as f3:
            json.dump(world, f3)