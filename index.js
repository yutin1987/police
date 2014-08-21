var XLSX  = require('xlsx');
var https = require('https');
var async = require('async');
var fs = require('fs');

var file = fs.readdirSync('./xlsx');

function getLocation (address, cb) {
  https.get('https://maps.googleapis.com/maps/api/geocode/json?address='+address+'&sensor=false', function(res) {
    var body = '';
    res.on('data', function (chunk) {
      body += chunk;
    });

    res.on('end', function () {
      try {
        body = JSON.parse(body);
        if ('ZERO_RESULTS' == body.status) {
          location = {
            lat: 0,
            lng: 0
          }
        } else {
          location = body.results[0].geometry.location;
        }
        setTimeout(function(){
          cb(null, location);
        }, 500);
      }
      catch (err) {
        setTimeout(function(){
          getLocation(address, cb);
        }, 3000);
      }
    });
  });
}

function getXLSX(file, cb) {
  var wb = XLSX.readFile(file);
  var ws = wb.Sheets[wb.SheetNames[0]];

  var title = wb.SheetNames[0];

  console.log(title);

  var list = [];

  var row = 2;
  while (ws['A'+row]) {
    list.push({
      'name': ws['A'+row].v.replace(/\s/,''),
      'address': (ws['C'+row] || ws['C'+(row-1)] || ws['C'+(row-2)]).v.replace(/\s/,''),
      'tel': (ws['D'+row] || ws['D'+(row-1)] || ws['D'+(row-2)]).v.replace(/\s/,'')
    });

    row += 1;
  }

  async.mapSeries(list, function (item, cb) {
    console.log('>', item.name, item.address);
    getLocation(item.address, function (err, location) {
      item.location = location;
      cb(null, item)
    });
  }, function (err, result) {
    fs.writeFileSync(
      './result/' + title + '.json',
      JSON.stringify(result)
    );
    cb();
  });
}


getXLSX(process.argv[2], function(){});

// async.eachSeries(file, function (item, cb) {
//   if (/.+\.xlsx/gi.exec(item)) {
//     getXLSX('./xlsx/'+item, cb);
//   } else {
//     cb();
//   }
// });