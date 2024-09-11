import { ElectrumNetworkProvider, Contract, Network, SignatureTemplate } from '@nexscript/nexscript';
import { ElectrumCluster, ElectrumTransport } from '@electrum-cash/network';

import artifact from './IGH_NPW_Token_P2PKH.json' with { type: "json" };
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

const nbPixel=64;
const nbX=8;
const nbY=8;

const contractLst=[];


const network = libnexa.Networks.testnet;
const wif = ""; 
const privateKey = libnexa.PrivateKey.fromWIF(wif, network);
const publicKey = '';
const addr = libnexa.PrivateKey(privateKey).toAddress();
const address = addr.toString();



const electrum = new ElectrumCluster('IGH_NPW', '1.4.0.1', 1, 1,undefined,undefined, undefined, undefined,true);
electrum.addServer('127.0.0.1',30001,ElectrumTransport.TCP.Scheme,true);
try {
  await electrum.ready();
} catch (e) {
  console.log('Failed to connect ', e);
}
const response = await electrum.request(
    "blockchain.block.headers", 0, 1);


const provider = new ElectrumNetworkProvider(Network.TESTNET,electrum,true);
const masterContract = new Contract(artifactMaster,[pkh],{provider});

var app = express();

app.set('view engine', 'ejs')
app.use(express.static('public'));

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
    let contract = new Contract(artifact,[currentContract.name,pkh],{provider});
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
            // code block
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

  var json = JSON.stringify(contractLst,(key,value) =>
    typeof value ==='bigint' 
      ? value.toString()
      : value //return everything else unchanged)
  );

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

  switch(newColor) {
    case 'white':
      colorTokenGroupId =whiteToken;
      break;
    case 'black':
      colorTokenGroupId =blackToken;
      break;
    case 'grey':
      colorTokenGroupId =greyToken;
    break;
    case 'red':
      colorTokenGroupId =redToken;
    break;
    case 'green':
      colorTokenGroupId =greenToken;
    break;
    case 'blue':
      colorTokenGroupId =blueToken;
    break;
    case 'yellow':
      colorTokenGroupId =yellowToken;
    break;
    case 'purple':
      colorTokenGroupId =purpleToken;
    break;
    default:
      // code block
      break;
  } 
  
  let contract = new Contract(artifact,[contractLst[pixelId].name, pkh],{provider});
  const utxos = await contract.getUtxos();
  const masterUtxos = await masterContract.getUtxos();


  let currentColorUtxo ='';
  var tokenCount = 0;

  for (var item in utxos){

    if(utxos[item].token != undefined &&
      utxos[item].token.groupId!=undefined &&
      utxos[item].token.amount>0n ){

        let currentToken = {groupId:utxos[item].token.groupId,amount:utxos[item].token.amount};
        currentColorUtxo = utxos[item];
        console.log("pixel "+utxos[item].token.groupId+" "+utxos[item].token.amount+" "+utxos[item].txid);
        
        tokenCount++;

        console.log("pixel "+currentColorUtxo.token.groupId+" "+currentColorUtxo.token.amount+" "+currentColorUtxo.txid);
    }

  }

  let newColorUtxo ='';
  tokenCount=0;
  for (var item in masterUtxos){
    if(masterUtxos[item].token != undefined && 
      masterUtxos[item].token.groupId!=undefined &&
      masterUtxos[item].token.groupId== colorTokenGroupId){
        let currentToken = {groupId:masterUtxos[item].token.groupId,amount:masterUtxos[item].token.amount};
        newColorUtxo = masterUtxos[item];
        console.log("pixel "+masterUtxos[item].groupId+" "+masterUtxos[item].amount+" "+masterUtxos[item].txid);
        
        
        tokenCount++;

        console.log("master "+currentToken.groupId+" "+currentToken.amount+" "+newColorUtxo.txid);
    }
  }

  if(currentColorUtxo.token.amount >0n){

    console.log("1ere requete "+currentColorUtxo.token.groupId+" "+currentColorUtxo.token.amount+" "+currentColorUtxo.txid);
    
    let tx = await contract.functions
    .RetrieveColorToken(publicKey, new SignatureTemplate(privateKey))
    .from(utxos)
    .to(masterContract.address,546n, currentColorUtxo.token).withHardcodedFee(1000n)
    .send();
  }

  let tokenToAdd = {groupId:colorTokenGroupId,amount:1n};
  let masterTx = await masterContract.functions
    .SendColorToken(publicKey,new SignatureTemplate(privateKey))
    .from(masterUtxos)
    .to(contract.address,546n)
    .to(masterContract.address,1n, newColorUtxo)
    .send();
}



