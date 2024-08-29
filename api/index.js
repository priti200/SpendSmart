const express = require('express');
const app = express();

app.get('/api/test',(req,res) =>{
    res.send({body:'test successfull'});
})

app.post('/api/transaction',(req,res) =>{
    res.json(req.body);
});

app.listen(3001,()=>{
    console.log("Server is running on port 3001");
});