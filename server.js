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
// app.get('/weather', handelWeather);
// app.get('/parks' , handelPark );

app.get('/movies', handleMovie);
app.get('/yelp', handleYelp);
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


function handleMovie (req , res) {
    try {
        let searchQuery = req.query.search_query;
        movieData(searchQuery , res)
    } catch (error) {
        res.status(500).send('Sorry! there is an error in handleMovie ' + error)
    }
}

 function movieData ( searchQuery , res) {
     const query = {
         api_key:'',
         q : searchQuery

     }
     let url = '';
superagent.get(url).query(query).then ( data =>{
    let finalArrayOfMovies = [];
    try {
        for (let index = 0; index < data.results.length; index++) {
            let title = data.body.results[i].title;
                let overview = data.body.results[i].overview;
                let average_votes = data.body.results[i].vote_average;
                let total_votes = data.body.results[i].vote_count;
                let image_url ='';
                let popularity = data.body.results[i].popularity;
                let released_on = data.body.results[i].release_date;
                let newMovie = new Movies(title ,overview ,average_votes ,total_votes, image_url ,popularity ,released_on);
                finalArrayOfMovies.push(newMovie);
           
            
        }    res.status(200).send(finalArrayOfMovies);

    } catch(error) {
        res.status(500).send(error);

    }
})
 }

 function yelpData ( searchQuery , res) {
    let key = process.env.YELP_API_KEY;

    const query = {
           location:searchQuery,
    }
    let url = 'https://api.yelp.com/v3/businesses/search';
    superagent.get(url).query(query).set('Authorization', `Bearer ${key}`).then(data => {
        try {
            let arrayOfYelp = [];
          let  loopArr = '', /// try to figure what to loop
            
            for(let index = 0 ; i< loopArr.length;index++){
                let name = obj[i].name;
                let image_url = obj[i].image_url;
                let price = obj[i].price;
                let rating = obj[i].rating;
                let url = obj[i].url;
               
                let newYelpConstructor = new Yelp(name,image_url,price,rating,url);
               arrayOfYelp.push(newYelpConstructor);
                
            }
            res.status(200).send('done');
       
    
        } catch (error) {
          res.status(500).send("Sorry something wrong in yelpData ... "+error);
        }
      }).catch((error) => {
        res.status(500).send("yelpFunction have a problem in promis .. (after then) " + error);
      });
    
}

   






function handleLocation(req, res) {
    console.log(req.query);
    let searchQuery = req.query.city;
    getLocationData(searchQuery, res);
}



function getLocationData(searchQuery, res) {

    let rowLength= checkIf(searchQuery);
    if(rowLength.length >0){
        let responseObject = new CityLocation(rowLength[0].searchquery, rowLength[0].formatted_query, rowLength[0].latitude, rowLength[0].longitude);
        res.status(200).send(responseObject); 
    }else{
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
    

}
// function getWeather (city , key ) {
//         city = req.query.city,
//         key = process.env.WEATHER_API_KEY


// let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${key}`;

// return superagent.get(url).then(weatherData  => {

//     let allWeather = weatherData.body.data.map(element => {
//         return new CityWeather(city,element);
//       })
//       return allWeather;
//     });

// }
// handeler function weather
// function handelWeather(req, res) {


//   const city = req.query.city;
//   const key = process.env.WEATHER_API_KEY;
//     getWeather(key,city).then(allWeatherArr =>
//          res.status(200).json(allWeatherArr));

// }



//// ***** creating a function to check if the data is in database or not ! ***********************************************/////

function checkIf(city) {
    let dbQuery = `SELECT * FROM locations WHERE searchQuery=$1`;
    let value = [city];
    return client.query(dbQuery,value).then(element => {
           return element.rows;
        })
};



////******************************************************constructors **************************************/

// function CityWeather(city,weatherData) {
//     this.forecast =  weatherData.weather.description;
//   this.time = weatherData.valid_date;
// }

function CityPark(name , address , fee , description , url) {

    this.name=name;
    this.address=address;
    this.fee=fee;
    this.description=description;
    this.url=url
}

function CityLocation(searchQuery, formatted_query, lat, lon) {
    this.searchQuery = searchQuery;
    this.display_name = formatted_query;
    this.latitude = lat;
    this.longitude = lon;
}

 function Moive(title , overview, average_votes, total_votes , image_url, popularity , released_on) {
     this.title=title;
     this.overview=overview;
     this.average_votes=average_votes;
     this.total_votes=total_votes;
    this.image_url = image_url;
     this.popularity=popularity;
     this.released_on=released_on;
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


