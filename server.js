'use strict';
let express = require('express');
const cors = require('cors');


let app = express();
app.use(cors());


require('dotenv').config();

const PORT = process.env.PORT;


/// endpoints

app.get('/location' , handelLocation);

// handeler function
function handelLocation(req , res )  {
    let searchQuery = req.query.city;
    let locationObject =  getLocation(searchQuery);
    res.status(200).send(locationObject);
};

function getLocation(searchQuery){
  
    let locationData = require('./data/location.json');
    let displayName = locationData[0].display_name;
    let latitude = locationData[0].lat;
    let longitude = locationData[0].lon;
  
    let resObject  = new CityLocation (searchQuery , displayName , latitude , longitude );
    return resObject;
}

// Constructor

function CityLocation (search , display_name, lat , long) {
    this.search_query = search;
    this.formatted_query= display_name;
    this.latitude = lat;
    this.longitude= long;
}

app.listen(PORT , ()=> {
 console.log('The app is listening on port ' + PORT)
});

