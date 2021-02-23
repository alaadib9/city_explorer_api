DROP TABLE IF EXISTS locations;

CREATE TABLE IF not EXISTS locations (
    id SERIAL PRIMARY KEY,
    searchQuery VARCHAR(255),
    formatted_query VARCHAR(255),
    latitude VARCHAR(255),
    longitude VARCHAR(255)
    
);

