var fs = require('fs');
var https = require('https');
var async = require('async');

var toCity = function (filename, cb) {
  if (!/.+\.json$/.exec(filename)) {
    cb();
    return;
  }
  
  var item = require('./result/' + filename);

  var x = item[0].location.lat;
  var y = item[0].location.lng;
  console.log(x,y);
  https.get('https://maps.googleapis.com/maps/api/geocode/json?language=en&latlng=' + x + ',' + y, function (res) {
    var body = '';
    res.on('data', function (chunk) {
      body += chunk;
    });

    res.on('end', function () {
      body = JSON.parse(body);
      var result = body.results;

      if (body.status != 'OK') {
        console.log('ERROR', filename, body);
      }

      var city = / *([\w]+) *city/gi.exec(result[0]['formatted_address']);

      if (city) {
        fs.writeFileSync(
          'city/' + city[1].toLowerCase() + '.json',
          JSON.stringify(item, null, 4)
        );

        setTimeout(function(){
          cb();
        }, 500)
      } else {
        console.log('ERROR', filename, body);
      }
    });

  });

}

async.eachSeries(fs.readdirSync('./result'), toCity);