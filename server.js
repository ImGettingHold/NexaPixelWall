import { ElectrumNetworkProvider, Contract, Network, SignatureTemplate, HashType } from '@nexscript/nexscript';
//import { ElectrumCluster, ElectrumTransport } from '@electrum-cash/network';

import sseExpress from 'sse-express';
import bodyParser from 'body-parser';
import _ from 'lodash';
import myQueue from './queue.js';

import express from 'express';
import fs from 'fs';


const pkh = '388a177f8e592b2a00122b9fb30b73137bb6458a';

const nbPixel=16384;
const nbX=128;
const nbY=128;





//const electrum = new ElectrumCluster('IGH_NPW', '1.4.0.1', 1, 1,undefined,undefined, undefined, undefined,true);
//electrum.addServer('127.0.0.1',30001,ElectrumTransport.TCP.Scheme,true);

//try {
//  await electrum.ready();
//} catch (e) {
//  console.log('Failed to connect ', e);
//}
//const response = await electrum.request("blockchain.block.headers", 0, 1);
//const provider = new ElectrumNetworkProvider(Network.TESTNET,electrum,true);




let globalId = 1;
let connections = [];

var app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.post('/sendMessage', (req, res) => {
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*'
  });

  connections.forEach(function(connection) {
    connection.sse('pixelChanged', {
      text: req.body.pixelChanged,
      color: req.body.color
    });
  });

  res.end();
});

app.get('/updates', sseExpress, function(req, res) {
  connections.push(res);
  res.sse('connected', {
  });

  req.on("close", function() {
    _.remove(connections, res);
    console.log('clients: ' + connections.length);
  });

  console.log(`Hello, ${globalId}!`);
});







app.get('/', function (req, res) {
  res.render('pixelwall');
});app.listen(3000, function () {
  console.log('NexaPixelWall app listening on port 3000!');
});






app.get('/ValidateColors/', function (req, res) {
  let pixelId = req.param('pixelId');
  let color = req.param('color');

  ValidateColor(pixelId,color);

  return(res);
})










//Change the color of 1 pixel in the blockchain
async function ValidateColor(pixelId, newColor){
  //Call worker
  //Queue
    // Add the pixel change job to the queue
  await myQueue.add({
    type: 'changePixelColor',
    data: { pixelId: pixelId,
            newColor: newColor
          }
  });

  
}



