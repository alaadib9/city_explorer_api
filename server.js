'use strict';
let express = require('express');
const cors = require('cors');
let superagent = require('superagent');
const pg = require('pg');

let app = express();
app.use(cors());
require('dotenv').config();
//const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

const PORT = process.env.PORT;



///////////////////////// endpoints///////////////////////////////////////////

app.get('/location', handleLocation);
app.get('/weather', handelWeather);
app.get('/parks', handelPark);
app.get('/movies', handleMovie);
app.get('/yelp', handleYelp);
app.get('*', handel404);

function handelPark(req, res) {
    try {
        getPark(req, res)
    } catch (error) {
        res.status(500).send('Sorry, an error happened in handlePark .. ' + error);
    }
};

function getPark(req, res) {
    const parkQuery = {
        api_key: process.env.PARKS_API_KEY,
        q: req.query.search_query,
        format: 'json',
    };
    let url = 'https://developer.nps.gov/api/v1/parks';
    superagent.get(url).query(parkQuery).then(data => {

        let theArrOfParkResults = [];
        data.body.data.map(element => {
            theArrOfParkResults.push(new CityPark(element.fullName, Object.values(element.addresses[0]).join(' '), element.entranceFees.cost, element.description, element.url))
        })

        res.status(200).send(theArrOfParkResults);
    }).catch(error => {
        res.status(500).send('There was an error getting data from Park API .... !!!!! ' + error);
    });

}


function handleMovie(req, res) {
    try {
        movieData(req, res)
    } catch (error) {
        res.status(500).send('Sorry! there is an error in handleMovie ' + error)
    }
}

function movieData(req, res) {
    console.log("query is .............",req.query)

    let url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${req.query.searchQuery}&limit=${20}`;

    superagent.get(url).then(data => {
        let finalArrayOfMovies = [];
        var theResult = JSON.parse(data.text).results;
        for (let index = 0; index < theResult.length; index++) {

            var moviesArr=  new Moive(
                theResult[index].title,
                theResult[index].overview,
                theResult[index].vote_average,
                theResult[index].vote_count,
                'https://image.tmdb.org/t/p/w500' + theResult[index].poster_path,
                theResult[index].popularity,
                theResult[index].release_date);
                finalArrayOfMovies.push(moviesArr)
            
        }
        res.status(200).send(finalArrayOfMovies);
    }).catch(error => {
        //console.log(error , "the error is")
        res.status(500).send('There was an error getting data from movie API ........!!!!!!!' + error);

    });
}

function handleYelp(req , res ) {
    try {
        yelpData(req, res)
    } catch (error) {
        res.status(500).send('Sorry, an error happened in handleYelp .. ' + error);
    }

}

 function yelpData ( req , res) {
    // console.log( "yelp query is .. " , req.query)
    let key = process.env.YELP_API_KEY;

    const query = {
           latitude:req.query.latitude,
           longitude:req.query.longitude,
           term:'restaurants',
           limit:5,
           offset:req.query.page*5
         
    }
    let url = 'https://api.yelp.com/v3/businesses/search';
    superagent.
    get(url).
    set('Authorization', `Bearer ${key}`).
    query(query).
    then(data => {
        console.log(data)
        console.log("yelp data is",JSON.parse(data.text).businesses);
            let arrayOfYelp = [];
          let  loopArr = JSON.parse(data.text).businesses ; /// try to figure what to loop

            for(let index = 0 ; index< loopArr.length;index++){
                let name = loopArr[index].name;
                let image_url = loopArr[index].image_url;
                let price = loopArr[index]. price;
                let rating = loopArr[index].rating;
                let url = loopArr[index].url;

                let newYelpConstructor = new CityYelp (name , image_url , price , rating , url);
               arrayOfYelp.push(newYelpConstructor);

            }
            res.status(200).send(arrayOfYelp);

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


}

// handeler function weather
function handelWeather(req, res) {

    try {
        getWeather(req, res)
    } catch (error) {
        res.status(500).send('Sorry, an error happened in hanerling weather function..' + error);
    }

}
function getWeather(req, res) {
    const queryWeather = {
        // city: req.query.search_query,
        key: process.env.WEATHER_API_KEY,
        lat: req.query.latitude,
        lon: req.query.longitude,

    }

    let url = `https://api.weatherbit.io/v2.0/forecast/daily`;

    superagent.get(url).query(queryWeather).then(data => {
        // console.log(data.body);
        let weatherArray = [];

        data.body.data.map(element => {
            weatherArray.push(new CityWeather(element.weather.description, new Date(element.valid_date).toDateString()))
        })

        res.status(200).send(weatherArray);
    }).catch(error => {
        res.status(500).send('There was an error getting data from weather API ....!! ' + error);
    });

}



//// ***** creating a function to check if the data is in database or not ! ***********************************************/////

function checkIf(city) {
    let dbQuery = `SELECT * FROM locations WHERE searchQuery=$1`;
    let value = [city];
    return client.query(dbQuery, value).then(element => {
        return element.rows;
    })
};



////******************************************************constructors **************************************/

function CityWeather(description, time) {
    this.forecast = description;
    this.time = time;
}

function CityPark(name, address, fee, description, url) {

    this.name = name;
    this.address = address;
    this.fee = fee;
    this.description = description;
    this.url = url
}

function CityLocation(searchQuery, formatted_query, lat, lon) {
    this.searchQuery = searchQuery;
    this.display_name = formatted_query;
    this.latitude = lat;
    this.longitude = lon;
}

function Moive(title, overview, average_votes, total_votes, image_url, popularity, released_on) {
    this.title = title;
    this.overview = overview;
    this.average_votes = average_votes;
    this.total_votes = total_votes;
    this.image_url = image_url;
    this.popularity = popularity;
    this.released_on = released_on;

}

function CityYelp (name , img_url , price , rating , url) {
    this.name=name;
    this.image_url=img_url;
    this.price=price;
    this.rating=rating;
    this.url=url;

}

////******************************************************constructors End **************************************/


/////************** Errors handler */

function handel404(req, res) {
    res.status(404).send({
        status: 500,
        responseText: "Sorry, something went wrong 404 "
    });
}

client.connect().then(() => {
    app.listen(PORT, () => {
        console.log('the app is listening to port ' + PORT);
    });
}).catch(error => {
    console.log('an error occurred while connecting to database ' + error);
});


