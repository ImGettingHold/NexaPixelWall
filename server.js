import { ElectrumNetworkProvider, Contract, Network, SignatureTemplate, HashType } from '@nexscript/nexscript';
//import { ElectrumCluster, ElectrumTransport } from '@electrum-cash/network';

import sseExpress from 'sse-express';

import artifact from './IGH_NPW_Token_P2PKH_v0_2.json' with { type: "json" };
import artifactMaster from './IGH_NPW_Master_P2PKH.json' with { type: "json" };
import express from 'express';
import fs from 'fs';
import libnexa from "libnexa-js";


const pkh = '';

const whiteToken = '';
const blackToken = '';
const greyToken = '';
const redToken = '';
const greenToken = '';
const blueToken = '';
const yellowToken = '';
const purpleToken = '';

const nbPixel=8;
const nbX=8;
const nbY=1;

const contractLst=[];


const network = libnexa.Networks.testnet;
const wif = ""; 
const privateKey = libnexa.PrivateKey.fromWIF(wif, network);
const publicKey = libnexa.PublicKey.fromPrivateKey(privateKey);
const addr = libnexa.PrivateKey(privateKey).toAddress();
const address = addr.toString();


//const electrum = new ElectrumCluster('IGH_NPW', '1.4.0.1', 1, 1,undefined,undefined, undefined, undefined,true);
//electrum.addServer('127.0.0.1',30001,ElectrumTransport.TCP.Scheme,true);

//try {
//  await electrum.ready();
//} catch (e) {
//  console.log('Failed to connect ', e);
//}
//const response = await electrum.request("blockchain.block.headers", 0, 1);
//const provider = new ElectrumNetworkProvider(Network.TESTNET,electrum,true);

// Initialise a network provider for network operations
const provider = new ElectrumNetworkProvider('testnet');

const masterContract = new Contract(artifactMaster,[pkh],{provider});

var app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));


//let testHello = 'Hello';
//const pixelUpdateNotifier = app.get('/pixelUpdates', sseExpress, function(req, res, next) {
//  res.sse('connected', {
//    HelloWorld:testHello
//  });  
//  next();
//});


await InstanciateContracts();


app.get('/', function (req, res) {
  res.render('pixelwall');
});app.listen(3000, function () {
  console.log('NexaPixelWall app listening on port 3000!');
});


async function InstanciateContracts(){
let x=0;
let y=0;


  console.log('=== Loading Table ... ===');
  for(let i=0;i<nbPixel;i++){
    console.log(((i/nbPixel)*100)+'%');

    let currentContract={
      name:x+"x"+y,
      id:i,
      address:"",
      color:'',
      balance:0,
      tokens:[]
    };

    let contract = new Contract(artifact,[pkh,currentContract.name],{provider});
    currentContract.address = contract.address;
    currentContract.balance = await contract.getBalance();
    let contractUTXOs = await contract.getUtxos();

    let tokenCount = 0;
    for (var item in contractUTXOs){
      if(contractUTXOs[item].token != undefined){
        let currentToken = {groupId:contractUTXOs[item].token.groupId,amount:contractUTXOs[item].token.amount};
        currentContract.tokens[tokenCount] = currentToken;
        tokenCount++;

        switch(currentToken.groupId) {
          case whiteToken:
            currentContract.color="white";
            break;
          case blackToken:
            currentContract.color="black";
            break;
          case greyToken:
            currentContract.color="grey";
          break;
          case redToken:
            currentContract.color="red";
          break;
          case greenToken:
            currentContract.color="green";
          break;
          case blueToken:
            currentContract.color="blue";
          break;
          case yellowToken:
            currentContract.color="yellow";
          break;
          case purpleToken:
            currentContract.color="purple";
          break;
          default:
        } 
      }
    }    

    contractLst[i] = currentContract;
    

    if(x==nbX-1){
      x=0;
      if(y==nbY-1){
        y=0;
      }
      else{y++;}
    }
    else{x++;}
  }

  console.log('100%');
  console.log('=== Finish ===');

  var json = JSON.stringify(contractLst,(key,value) => typeof value ==='bigint' ? value.toString(): value);

  fs.writeFileSync('public/nexapixels.json',json);

}

app.get('/ValidateColors/', function (req, res) {
  let pixelId = req.param('pixelId');
  let color = req.param('color');

  ValidateColor(pixelId,color);

  return(res);
})




async function ValidateColor(pixelId, newColor){
  let colorTokenGroupId = "";

  let pixelContract = new Contract(artifact,[pkh,contractLst[pixelId].name],{provider});

  switch(newColor) {
    case 'white':
      colorTokenGroupId =whiteToken;
      pixelContract.color='white';
      break;
    case 'black':
      colorTokenGroupId =blackToken;
      pixelContract.color='black';
      break;
    case 'grey':
      colorTokenGroupId =greyToken;
      pixelContract.color='grey';
    break;
    case 'red':
      colorTokenGroupId =redToken;
      pixelContract.color='red';
    break;
    case 'green':
      colorTokenGroupId =greenToken;
      pixelContract.color='green';
    break;
    case 'blue':
      colorTokenGroupId =blueToken;
      pixelContract.color='blue';
    break;
    case 'yellow':
      colorTokenGroupId =yellowToken;
      pixelContract.color='yellow';
    break;
    case 'purple':
      colorTokenGroupId =purpleToken;
      pixelContract.color='purple';
    break;
    default:
      break;
  } 
  
  const utxos = await pixelContract.getUtxos();
  const masterUtxos = await masterContract.getUtxos();


  let currentColorUtxo ='';
  var tokenCount = 0;

  for (var item in utxos){

    if(utxos[item].token != undefined &&
      utxos[item].token.groupId !=undefined &&
      utxos[item].token.amount == 1n ){

        let currentToken = {groupId:utxos[item].token.groupId,amount:utxos[item].token.amount};
        currentColorUtxo = utxos[item];
        console.log("pixel "+utxos[item].token.groupId+" "+utxos[item].token.amount+" "+utxos[item].txid);
        
        tokenCount++;

        console.log("pixel "+currentColorUtxo.token.groupId+" "+currentColorUtxo.token.amount+" "+currentColorUtxo.txid);
    }

  }

  let newColorUtxo ='';
  tokenCount=0;

  console.log('colorTokenGroupId :'+colorTokenGroupId);
  for (var item in masterUtxos){
    if(masterUtxos[item].token != undefined &&
      masterUtxos[item].token.groupId == colorTokenGroupId){

        let currentToken = {groupId:masterUtxos[item].token.groupId,amount:masterUtxos[item].token.amount};
        newColorUtxo = masterUtxos[item];
        console.log("master new pixel "+masterUtxos[item].token.groupId+" "+masterUtxos[item].token.amount+" "+masterUtxos[item].txid);
        
        
        tokenCount++;

        console.log("master "+currentToken.groupId+" "+currentToken.amount+" "+newColorUtxo.txid);
    }
  }

  if(currentColorUtxo.token != undefined){

    console.log("1st request : "+currentColorUtxo.token.groupId+" "+currentColorUtxo.token.amount);
    console.log('master address: '+masterContract.address);
    console.log('public key: '+publicKey);
    console.log('private key: '+privateKey);
    console.log('utxo count: '+utxos.length);
    console.log('utxo : '+utxos);
    console.log('private key'+new SignatureTemplate(privateKey.toBuffer()));

    pixelContract.balance = await pixelContract.getBalance();
    if(pixelContract.balance <= 1000n){
      let refillTx= await masterContract.functions
      .SendColorToken(publicKey.toString(), new SignatureTemplate(wif,HashType.SIGHASH_ALL))
      .to(pixelContract.address,10000n)
      .send();

      console.log('RefillTx : '+refillTx);

      //await 1s for transaction to propagate
      sleep(1000);
    }
    
    let tx = await pixelContract.functions
    .RetrieveColorToken(publicKey.toString(), new SignatureTemplate(wif,HashType.SIGHASH_ALL))
    .to(masterContract.address,546n, currentColorUtxo.token,currentColorUtxo.token)
    .send();

    console.log('PixelTx : '+tx);
  }

  let tokenToAdd = {groupId:colorTokenGroupId,amount:1n};
  let masterTx = await masterContract.functions
    .SendColorToken(publicKey.toString(), new SignatureTemplate(wif,HashType.SIGHASH_ALL))
    .to(pixelContract.address,546n,tokenToAdd)
    .send();

  console.log('masterTx : '+masterTx)

  //save value in cache
  contractLst[pixelId] = pixelContract;
  var json = JSON.stringify(contractLst,(key,value) => typeof value ==='bigint' ? value.toString(): value);
  fs.writeFileSync('public/nexapixels.json',json);
  console.log('cache saved');

}



