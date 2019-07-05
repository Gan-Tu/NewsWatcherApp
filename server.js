var express = require('express');
var app = express();

const PORT = process.env.PORT || 3000;


app.get('/', function(req, res) {
    console.log("Send message on get request");
    res.send('Hello full-stack development!');
});

app.set('port', PORT);

var server = app.listen(PORT, function() {
    console.log(`Express server listening on http://localhost:${PORT}`);
});