import myQueue from './queue.js';

import { ElectrumNetworkProvider, Contract, Network, SignatureTemplate, HashType } from '@nexscript/nexscript';

import artifact from './IGH_NPW_Token_P2PKH_v0_2.json' with { type: "json" };
import fs from 'fs';
import libnexa from "libnexa-js";
import artifactMaster from './IGH_NPW_Master_P2PKH.json' with { type: "json" };


const pkh = '';

const whiteToken = '';
const blackToken = '';
const greyToken = '';
const redToken = '';
const greenToken = '';
const blueToken = '';
const yellowToken = '';
const purpleToken = '';

const nbPixel=16384;
const nbX=128;
const nbY=128;
const sleep = ms => new Promise(res => setTimeout(res, ms));

const contractLst=[];


const network = libnexa.Networks.testnet;
const wif = ""; 
const privateKey = libnexa.PrivateKey.fromWIF(wif, network);
const publicKey = libnexa.PublicKey.fromPrivateKey(privateKey);
const addr = libnexa.PrivateKey(privateKey).toAddress();
const address = addr.toString();

// Initialise a network provider for network operations
const provider = new ElectrumNetworkProvider('testnet');

const masterContract = new Contract(artifactMaster,[pkh],{provider});


await InstanciateContracts();

myQueue.process(async (job) => {
  console.log(job.data);
  
  // Do some work here based on the job type
  switch(job.data.type) {
    case 'changePixelColor':
      console.log('Job changePixelColor launched');
      await ValidateColor(job.data.data.pixelId, job.data.data.newColor)
      break;
    default:
      console.log('Unknown job type');
  }
});

console.log('Worker started');

async function InstanciateContracts(){
    let x=0;
    let y=0;
    
    
      console.log('=== Loading Table ... ===');
      for(let i=0;i<nbPixel;i++){
        console.log(((i/nbPixel)*100)+'%');
    
        await RecoverContract(x,y,i);    
    
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
    
      let json = JSON.stringify(contractLst,(key,value) => typeof value ==='bigint' ? value.toString(): value);
    
      fs.writeFileSync('public/nexapixels.json',json);
    
    }
  
  async function RecoverContract(x,y,id){
    let currentContract={
      name:'x'+x+'y'+y,
      xCoordinates:x,
      yCoordinates:y,
      id:id,
      address:"",
      color:'',
      balance:0,
      tokens:[]
    };
  
    //We seek in the cache if the pixel already exists and load it if so
    if(fs.readFileSync('public/nexapixels.json').length >0){
    let json = JSON.parse(fs.readFileSync('public/nexapixels.json'));
  
    if(json[id] != undefined){
      currentContract.address = json[id].address;
      currentContract.balance = json[id].balance;
      currentContract.color = json[id].color;
      currentContract.tokens = json[id].tokens;
    }
  
    }
    contractLst[id] = currentContract;
  }

//Change the color of 1 pixel in the blockchain
async function ValidateColor(pixelId, newColor){

    console.log('ValidateColor function');

    let colorTokenGroupId = "";
  
    //retrieve the corresponding smart-contract of the selected pixel
    let pixelContract = new Contract(artifact,[pkh,contractLst[pixelId].name],{provider});


    console.log('pixelContract recovered');
    console.log(pixelContract);
  
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
    
    //Get the pixel smart contract UTXOs
    let utxos = await pixelContract.getUtxos();

    console.log('PixelUTXO recovered');
    console.log(utxos);
  
    //Get the master smart contract UTXOs
    let masterUtxos = await masterContract.getUtxos();
    console.log('masterUtxos recovered');
    console.log(masterUtxos);
  
  
    let currentColorUtxo ='';
    let tokenCount = 0;
  
    //Seek which color token was previously on the pixel smart contract
    for (var item in utxos){
  
      if(utxos[item].token != undefined &&
        utxos[item].token.groupId !=undefined &&
        utxos[item].token.amount == 1n ){
  
          let currentToken = {groupId:utxos[item].token.groupId,amount:utxos[item].token.amount};
          currentColorUtxo = utxos[item];
          
          tokenCount++;
      }
  
    }

    console.log('currentColorUtxo recovered');
    console.log(currentColorUtxo);
  
    let newColorUtxo ='';
    tokenCount=0;
  
    //Seek the new color token to send from the master smart contract to the pixel smart contract
    for (let item in masterUtxos){
      if(masterUtxos[item].token != undefined &&
        masterUtxos[item].token.groupId == colorTokenGroupId){
  
          let currentToken = {groupId:masterUtxos[item].token.groupId,amount:masterUtxos[item].token.amount};
          newColorUtxo = masterUtxos[item];        
          
          tokenCount++;
      }
    }
    console.log('newColorUtxo recovered');
    console.log(newColorUtxo);
  
    if(currentColorUtxo.token != undefined){
  
      //Get the balance on the pixel smart contract to check there is enough to send back the previous color token
      pixelContract.balance = await pixelContract.getBalance();

    console.log('pixel balance recovered');
    console.log(pixelContract.balance);

      if(pixelContract.balance <= 1000n){
        //If not, refill the pixel smart contract
        let refillTx= await masterContract.functions
        .SendColorToken(publicKey.toString(), new SignatureTemplate(wif,HashType.SIGHASH_ALL))
        .to(pixelContract.address,10000n)
        .send();
  
        console.log('RefillTx : '+refillTx);
  
        //await 1s for transaction to propagate
        sleep(1000);
      }
      
      //Send back the previous color token from pixel smart contract to master smart contract
      let tx = await pixelContract.functions
      .RetrieveColorToken(publicKey.toString(), new SignatureTemplate(wif,HashType.SIGHASH_ALL))
      .to(masterContract.address,546n, currentColorUtxo.token,currentColorUtxo.token)
      .send();
  
      console.log('PixelTx : '+tx);
    }
  
    //send the new color token from master smart contract to pixel smart contract
    let tokenToAdd = {groupId:colorTokenGroupId,amount:1n};
    let masterTx = await masterContract.functions
      .SendColorToken(publicKey.toString(), new SignatureTemplate(wif,HashType.SIGHASH_ALL))
      .to(pixelContract.address,546n,tokenToAdd)
      .send();
  
    console.log('masterTx : '+masterTx)
  
    //await 1s for transaction to propagate
    sleep(1000);
  
    //save value in cache
    await FillContract(contractLst[pixelId].xCoordinates,contractLst[pixelId].yCoordinates,pixelId);
    //contractLst[pixelId] = pixelContract;
    let json = JSON.stringify(contractLst,(key,value) => typeof value ==='bigint' ? value.toString(): value);
    fs.writeFileSync('public/nexapixels.json',json);
    console.log('cache saved');
  
  
    //Send update to other players
    fetch('http://localhost:3000/sendMessage', {
      method: 'POST',
      headers: {
      'Access-Control-Allow-Origin': '*',
        'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      body: 'pixelChanged='+ contractLst[pixelId].name + '&color=' + pixelContract.color
    });
    console.log('update sent');  
    
  }


  async function FillContract(x,y,id){
    let currentContract={
      name:'x'+x+'y'+y,
      xCoordinates:x,
      yCoordinates:y,
      id:id,
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
  
    contractLst[id] = currentContract;
  }