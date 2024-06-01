# URL Shortener [link](https://u-s.es/)

This web application is a URL shortener service. It allows users to input a long URL and create a shorter, more manageable version. This is particularly useful for sharing links on platforms with character limits, like Twitter, or for creating more readable URLs.

## Endpoints

### GET /count

This endpoint returns the total number of URLs that have been shortened by the service. It does not require any parameters.

Response:

```json
{ "count": number }
```

### POST /create

This endpoint is used to create a new shortened URL. It requires a JSON body with the following structure:

```json
{  "shortUrl": string, "longUrl": string  }
```

`shortUrl` is the desired shortened URL. It must be no more than 20 characters long and cannot be one of the following reserved words: 'helloworld', 'favicon.ico', 'privacy-policy', 'terms-and-conditions', 'cookie-policy', 'contact', 'count', 'create', 'admin', '404'.

`longUrl` is the original, long URL that should be shortened. It cannot contain a domain that is on the application's blocklist.

Responses:

- If the `shortUrl` exceeds the maximum length or is a reserved word, or if the `longUrl` contains a blocked domain, the response will have a status of 400 and a body of:

```json
{  "error": string  }
```

- If the `shortUrl` is already in use, the response will have a status of 400 and a body of:

```json
{  "error": "This short URL is already in use"  }
```

- If the URL is successfully created, the response will have a status of 200 and a body of:

```json
{  "message": "URL successfully created" }

```

## Error Handling

The application has robust error handling. If an error occurs while processing a request, the application will return a response with a status of 500 and a body of:

```json
{ "error": "An error occurred while processing your request" }
```

## Running the Application

To run the application, you will need Node.js and MongoDB installed on your machine. Once you have these installed, you can start the application by running `node app.js` in the terminal.

## Contributing

Contributions are welcome! Please submit a pull request or create an issue to propose changes or additions.
```