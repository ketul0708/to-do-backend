/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

const express = require('express')
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient;

// declare a new express app
const app = express()
app.use(bodyParser.json())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

const url = "mongodb://127.0.0.1:27017";
const options = { useNewUrlParser: true, useUnifiedTopology: true };
const client = new MongoClient(url, options);

/**********************
 * Example get method *
 **********************/

app.get('/todo', function(req, res) {
  // Add your code here
//   getData(req, res);
    console.log("Got request");
    res.send({success: "true"});
});

app.get('/todo/tasklist/:userId', function(req, res) {
  // Add your code here
  getTasklistt(req, res);
});

app.get('/todo/*', function(req, res) {
  // Add your code here
  res.json({success: 'get call succeed!', url: req.url});
});

/****************************
* Example post method *
****************************/

app.post('/todo', function(req, res) {
  // Add your code here
  res.json({success: 'post call succeed!', url: req.url, body: req.body})
});

app.post('/todo/login', function(req, res) {
  // Add your code here
  login(req, res);
});

app.post('/todo/signup', function(req, res) {
  // Add your code here
  signup(req, res);
});

/****************************
* Example put method *
****************************/

app.put('/todo', function(req, res) {
  // Add your code here
  res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

app.put('/todo/tasklist/:userId', function(req, res) {
  addToTasklist(req, res);
  //res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

app.put('/todo/edit/:userId', function(req, res) {
  editTask(req, res);
  //res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

app.put('/todo/start/:userId', function(req, res) {
  startTask(req, res);
  //res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

app.put('/todo/end/:userId', function(req, res) {
  endTask(req, res);
  //res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

app.put('/todo/removetasklist/:userId', function(req, res) {
  removeTasklist(req, res);
  //res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

app.put('/todo/changepwd', function(req, res) {
  // Add your code here
  changePassword(req, res);
});


app.listen(3000, function() {
    console.log("App started")
});

async function login(req, res){
  
  try {
    await client.connect();
    var dbo = client.db('to-do');
    var collection = dbo.collection('users');
    var data = await collection.find({'userId':req.body.userId}).toArray();
    if(data.length==0){
      res.json({status: 'nouser'});
    }
    else if(data[0]['password']==req.body.password){
      console.log("Login successful");
      res.setHeader('Content-Type', 'text/plain');
      res.json({userId: req.body.userId, password: req.body.password, status: 'true'});
    }
    else{
      console.log("Login unsuccessful");
      res.setHeader('Content-Type', 'text/plain');
      res.json({status: 'false'});
    }
  } catch (error) {
    res.send(error);
  }

}

async function signup(req, res){
  
  try {
    await client.connect();
    var dbo = client.db('to-do');
    var collection = dbo.collection('users');
    var data = await collection.find({'userId':req.body.userId}).toArray();
    if(data.length!=0){
      res.send('unavailable');
    }
    else{
      await collection.insertOne({userId: req.body.userId, password: req.body.password});
      res.send("Successfully created user");
    }
  } catch (error) {
    console.log(error);
  }

}

async function addToTasklist(req, res){

  try {
    const userId = req.params.userId;

    await client.connect();
    const dbo = client.db('to-do');
    const collection = dbo.collection('userdata');
    const task = req.body.task;
    // Fetch the user's current watchlist
    const user = await collection.findOne({ userId: userId});
    console.log(user);
    if(user==null){
        await collection.insertOne({userId: userId, tasklist: [task]});
        res.json({success: true, message: "Created new watchlist"});
    }
    else{
      var currentTasklist = user.tasklist || [];
      if(!contains(currentTasklist, task)){
        currentTasklist.push(task);
        await collection.updateOne({ userId }, { $set: { tasklist: currentTasklist } });
        res.json({ success: "Updated tasklist", user: user });
      }
      else{
        res.json({success: "Task already in tasklist"})
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getTasklistt(req, res){
  try {
    const userId = req.params.userId;

    await client.connect();
    const dbo = client.db('to-do');
    const collection = dbo.collection('userdata');

    // Fetch the user's current watchlist
    const user = await collection.findOne({ userId: userId});
    if(user==null){
      res.json({tasklist: []});
    }
    else{
      var currentTasklist = user.tasklist || [];
      res.json({tasklist: currentTasklist});
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function removeTasklist(req, res){
  try {
    const userId = req.params.userId;

    await client.connect();
    const dbo = client.db('to-do');
    const collection = dbo.collection('userdata');
    const task = req.body.task;

    // Fetch the user's current watchlist
    const user = await collection.findOne({ userId: userId});
    if(user!=null){
      var currentTasklist = user.tasklist || [];
      if(currentTasklist.length!=0){
        const index = getIndex(currentTasklist, task);
        if (index > -1) { // only splice array when item is found
          currentTasklist.splice(index, 1); // 2nd parameter means remove one item only
        }
        await collection.updateOne({ userId }, { $set: { tasklist: currentTasklist } });
        res.json({ success: "Updated watchlist", tasklist: currentTasklist });
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function startTask(req, res){
  try {
    const userId = req.params.userId;

    await client.connect();
    const dbo = client.db('to-do');
    const collection = dbo.collection('userdata');
    const startTime = req.body.startTime;
    const task = req.body.task;
    // Fetch the user's current watchlist
    const user = await collection.findOne({ userId: userId});
    if(user!=null){
      var currentTasklist = user.tasklist || [];
      if(currentTasklist.length!=0){
        const index = getIndex(currentTasklist, task);
        if (index > -1) { // only splice array when item is found
          currentTasklist[index][6] = startTime;
        }
        await collection.updateOne({ userId }, { $set: { tasklist: currentTasklist } });
        res.json({ success: "Updated watchlist", tasklist: currentTasklist });
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function endTask(req, res){
  try {
    const userId = req.params.userId;

    await client.connect();
    const dbo = client.db('to-do');
    const collection = dbo.collection('userdata');
    const endTime = req.body.endTime;
    const task = req.body.task;

    // Fetch the user's current watchlist
    const user = await collection.findOne({ userId: userId});
    if(user!=null){
      var currentTasklist = user.tasklist || [];
      if(currentTasklist.length!=0){
        const index = getIndex(currentTasklist, task);
        if (index > -1) { // only splice array when item is found
          currentTasklist[index][7] = endTime;
          currentTasklist[index][5] = "True";
        }
        await collection.updateOne({ userId }, { $set: { tasklist: currentTasklist } });
        res.json({ success: "Updated watchlist", tasklist: currentTasklist });
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function editTask(req, res){
  try{
    const userId = req.params.userId;
    await client.connect();
    const dbo = client.db('to-do');
    const collection = dbo.collection('userdata');
    const task = req.body.task;
    const user = await collection.findOne({ userId: userId});
    if(user!=null){
      var currentTasklist = user.tasklist || [];
      if(currentTasklist.length!=0){
        const index = getIndex(currentTasklist, task);
        if (index > -1) { // only splice array when item is found
          currentTasklist[index] = task;
        }
        await collection.updateOne({ userId }, { $set: { tasklist: currentTasklist } });
        res.json({ success: "Updated watchlist", tasklist: currentTasklist });
      }
    }
  }
  catch(error){
    res.status(500).json({ success: false, error: error.message });
  }
}

async function changePassword(req, res){
  try {
    await client.connect();
    const dbo = client.db('to-do');
    const collection = dbo.collection('users');
    const userId = req.body.userId;
    const newPwd = req.body.password;

    await collection.updateOne({ userId }, { $set: { password: newPwd } });
    res.json({status: "true"});

  } catch (error) {
    res.status(500).json({ status: "false", error: error.message });
  }
}

function contains(currentTasklist, task){
  for(let i=0; i<currentTasklist.length; i++){
    if(currentTasklist[i].toString()==task.toString()){
      return true;
    }
  }
  return false;
}

function getIndex(currentTasklist, toRemove){
  for(let i=0; i<currentTasklist.length; i++){
    if(currentTasklist[i][0].toString() == toRemove[0].toString()){
      return i;
    }
  }
  return -1;
}

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
