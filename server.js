'use strict';
let express = require('express');
const cors = require('cors');
let superagent = require('superagent');
const pg = require('pg');

let app = express();
app.use(cors());
require('dotenv').config();
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

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
//         q: req.query.search_query,
//     };
//     let url = 'https://developer.nps.gov/api/v1/parks';
//     return superagent.get(url).query(query).then(data => {
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

function CityPark(name , address , fee , description , url) {

    this.name=name;
    this.address=address;
    this.fee=fee;
    this.description=description;
    this.url=url
}




// handeler function
function handleLocation(req, res) {
    console.log(req.query);
    let searchQuery = req.query.city;
    getLocationData(searchQuery, res);

}



function getLocationData(searchQuery, res) {

    let rowLength = checkIf(searchQuery);
    if (rowLength.length > 0) {
        let responseObject = new CityLocation(rowLength[0].searchquery, rowLength[0].formatted_query, rowLength[0].latitude, rowLength[0].longitude);
        res.status(200).send(responseObject);
    } else {
        const query = {
            key: process.env.GEOCODE_API_KEY,
            q: searchQuery,
            limit: 1,
            format: 'json'
        };
        let url = 'https://us1.locationiq.com/v1/search.php';
        return superagent.get(url).query(query).then(data => {
            try {
                let formatted_query = data.body[0].display_name;
                let latitude = data.body[0].lat;
                let longitude = data.body[0].lon;
                let dbQuery = 'INSERT INTO locations (searchquery,formatted_query,latitude,longitude)  VALUES ($1,$2,$3,$4)returning *';
                let safeValues = [searchQuery, formatted_query, latitude, longitude];

                client.query(dbQuery, safeValues).then(data => {
                    console.log('data returned back from db ', data.rows);
                }).catch(error => {
                    console.log('an error occurred ' + error);
                });
                let responseObject = new CityLocation(searchQuery, formatted_query, latitude, longitude);
                res.status(200).send(responseObject);
            } catch (error) {
                res.status(500).send(error);
            }
        }).catch(error => {
            res.status(500).send('There was an error getting data from API ' + error);
        });
    }


};

// function getWeather(req, res) {
//     const city = req.query.city;
//     const query = {
//         key: process.env.WEATHER_API_KEY,
//         lat: req.query.latitude,
//         lon: req.query.longitude,
//         format: 'json',
//     }

//     let url = `https://api.weatherbit.io/v2.0/forecast/daily`;
    // superagent.get(url).then(weatherData  => {
  
    //     let allWeather = weatherData.body.data.map(element => {
    //         return new CityWeather(city,element).toDateString();
    //       })
          
    //     });

    // superagent.get(url).query(query).then(data => {
//         superagent.get(url).then(weatherData  => {

//         try {
//         let allWeather = weatherData.body.data.map(element => {
//             return new CityWeather(city,element).toDateString();
//           })
//         //     let arrayOfResults = [];

//         // data.body.data.map(value => {
//         //    arrayOfResults.push(new CityWeather(city,weatherData).toDateString())
//         // })
//         res.status(200).send(allWeather);
//         } catch (error) {
//             res.status(500).send(error);
//         }
//     }).catch(error => {
//         res.status(500).send('There are an error in  getting data from weather API ... ' + error);
//     });
    
// }; 

// handeler function weather
function handelWeather(req, res) {
    const city = req.query.search_query;
  const key = process.env.WEATHER_API_KEY;

  // (get data from API)
  getWeather(key,city)
    .then(allWeatherArr => res.status(200).json(allWeatherArr));
    // try {
        
    // getWeather(req, res); 
    // } catch (error) {
    //     res.status(500).send('Sorry! something went wrong in handel weather data.. ' + error);
    }

// }

//////////////************************get routs functions ******************************************************************** */

// function getlocation(city, key) {

//     let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;
//     return superagent.get(url)
//         .then(geoData => {
//             addToDb(city, geoData.body[0].display_name, geoData.body[0].lat, geoData.body[0].lon);
//             const locationData = new Location(city, geoData.body[0].display_name, geoData.body[0].lat, geoData.body[0].lon);
//             return locationData;
//         });
// }

//// ***** creating a function to check if the data is in database or not ! ***********************************************/////

function checkIf(city) {
    let dbQuery = `SELECT * FROM locations WHERE searchQuery=$1`;
    let value = [city];
    return client.query(dbQuery, value).then(element => {
        return element.rows;
    })
};

/// ****** function to add new cities to database  ************************************************************//////
// function addToDb(city, geoData) {
//     let searchQuery = city;
//     let formatted_query = geoData[0].display_name;
//     let latitude = geoData[0].lat;
//     let longitude = geoData[0].lon;
//     let dbQuery = 'INSERT INTO locations (searchQuery,formatted_query,latitude,longitude)  VALUES ($1,$2,$3,$4)';
//     let safeValues = [searchQuery, formatted_query, latitude, longitude];
//     client.query(dbQuery, safeValues).then()

// };


////******************************************************constructors **************************************/

// function CityWeather(city,weatherData) {
//     this.forecast =  weatherData.weather.description;
//   this.time = weatherData.valid_date;
// }
// return array of weather objects for the city requested

function getWeather(key,city){
    let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${key}`;
    return superagent.get(url)
      .then(weatherData =>{
        let allWeather = weatherData.body.data.map(element => {
          return new Weather(city,element);
        })
        return allWeather;
      });
  }


function CityLocation(searchQuery, formatted_query, lat, lon) {
    this.searchQuery = searchQuery;
    this.display_name = formatted_query;
    this.latitude = lat;
    this.longitude = lon;
}

function Weather(city,weatherData) {
    this.forecast = weatherData.weather.description;
    this.time = weatherData.valid_date;
  }
////******************************************************constructors End **************************************/


/////************** Errors handler */

function handel404(req, res) {
    res.status(404).send({
        status: 500,
        responseText: "Sorry, something went wrong"
    });
}

client.connect().then(() => {
    app.listen(PORT, () => {
        console.log('the app is listening to port ' + PORT);
    });
}).catch(error => {
    console.log('an error occurred while connecting to database ' + error);
});


