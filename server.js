'use strict';
let express = require('express');
const cors = require('cors');
let superagent = require('superagent')

let app = express();
app.use(cors());
require('dotenv').config();

const PORT = process.env.PORT;


/// endpoints

app.get('/location', handleLocation);
app.get('/weather', handelWeather);
// app.get('/parks' , handelPark )
app.get('*', handel404);

// function handelPark (req, res) {
//     res.send('GET request to the homepage')
//   };

// function getPark() {
//     const query = {
//         key: process.env.PARKS_API_KEY,
//     };
//     let url = '';
//     return superagent.get(url).then(data => {
//         try {
//             let name = '';
//             let address ='' ;
//             let fee = '';
//             let description ='';
//             let url =url ='';
//             let resObject = new CityPark(name , address , fee , description , url);
//             return resObject;
//         } catch (error) {
//             res.status(500).send(error);
//         }
//     }).catch(error => {
//         res.status(500).send('There was an error getting data from API ' + error);
//     });

// }

// function CityPark(name , address , fee , description , url) {

//     this.name=name;
//     this.address=address;
//     this.fee=fee;
//     this.description=description;
//     this.url=url
// }




// handeler function
function handleLocation(req, res) {
    console.log(req.query);
    let searchQuery = req.query.city;
    getLocationData(searchQuery).then(data => {
        res.status(200).send(data);
    });

}


function getLocationData(searchQuery) {

    const query = {
        key: process.env.GEOCODE_API_KEY,
        q: searchQuery,
        limit: 1,
        format: 'json'
    };
    let url = 'https://us1.locationiq.com/v1/search.php';
    return superagent.get(url).query(query).then(data => {
        try {
            let longitude = data.body[0].lon;
            let latitude = data.body[0].lat;
            let displayName = data.body[0].display_name;
            let responseObject = new CityLocation(searchQuery, displayName, latitude, longitude);
            return responseObject;
        } catch (error) {
            res.status(500).send(error);
        }
    }).catch(error => {
        res.status(500).send('There was an error getting data from API ' + error);
    });

}

function getWeather (city , key ) {
    // const query = {
    //     city = req.query.city,
    //     key = process.env.WEATHER_API_KEY
    // };

let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${key}`;

return superagent.get(url).then(weatherData  => {
  
    let allWeather = weatherData.body.data.map(element => {
        return new CityWeather(city,element);
      })
      return allWeather;
    });

}
// handeler function weather
function handelWeather(req, res) {

    
  const city = req.query.city;
  const key = process.env.WEATHER_API_KEY;
    getWeather(key,city).then(allWeatherArr =>
         res.status(200).json(allWeatherArr));
    
}

function handel404(req, res) {
    res.status(404).send({
        status: 500,
        responseText: "Sorry, something went wrong"
    });
}





/// weather constructor 

function CityWeather(city,weatherData) {
    this.forecast =  weatherData.weather.description;
  this.time = weatherData.valid_date;
}

// Constructor

function CityLocation(searchQuery, displayName, lat, lon) {
    this.search_query = searchQuery;
    this.formatted_query = displayName;
    this.latitude = lat;
    this.longitude = lon;
}


app.listen(PORT, () => {
    console.log('The app is listening on port ' + PORT)
});

