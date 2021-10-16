const express = require("express");
const app = express();
const socket = require("socket.io");
const cors = require("cors");
const mysql = require("mysql");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const { query } = require("express");
const saltRounds = 10;




app.use(cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
}));
app.use(express.json());

app.use(cookieParser());
app.use(express.urlencoded({extended:true}));

app.use(session({
    key: "login",
    secret: "WuPQz1wqAc1f3MJD4V*zIzQ&2$sb$SFMTk5mRR#Z0JYi&UBjq*",
    resave: false,
    saveUninitialized: false,

    cookie:{}
    
}))


app.use(express.static(__dirname))



const db = mysql.createConnection({
    host: "bfezgqb2ebryyrcyyq5n-mysql.services.clever-cloud.com",
    user: "uxjcpsp5bqawojih",
    password: "J4Acs1AERMAfOZPRuiE",
    database: "bfezgqb2ebryyrcyyq5n",
    port: 21096
})


const server = app.listen("8080",()=>{
    console.log("I am listening");
})


const io = socket(server,{
    cors:{
        methods: ["GET", "POST"]
    }
});


let users = [];

io.on("connection",(socket)=>{
  

    socket.on("user_connected",(data)=>{
        users[data] = socket.id;


    })
   
    socket.on("send",({from,to,msg})=>{

        const query = "INSERT INTO messages(from_id,to_id,txt) VALUES (?,?,?)";

        db.query(query,[from,to,msg],(err,data)=>{
            if(err){
                console.log(err);
            }

            if(data){
                const socketId = users[to];


                socket.join(socketId);
                socket.to(socketId).emit("new message",{from:from,to:to,msg:msg})
        
                socket.leave(socketId);
            }

        })

       
      

    })


   

})


app.post("/Messages",(req,res)=>{
    const from_id = req.body.from;
    const to_id = req.body.to;

    const query = "SELECT * FROM messages WHERE from_id = ? AND to_id = ? OR from_id = ? AND to_id = ? ORDER BY id ASC";
    
    db.query(query,[from_id,to_id,to_id,from_id],(err,data)=>{
        if(err){
            console.log(err);
            res.send(err);
        }


        if(data){
            if(data.length > 0){
                res.send(data);
            }else{
                res.send(JSON.stringify({res:"ok",msg:"No messages Yet"}))
            }
        }

    })

})



app.get('/', function(req, res) {

    res.send("hhh")
  })

app.get("/login",(req,res)=>{

    
    
    if(req.session.user){
        res.send(JSON.stringify({islogin:true}));
    }else{
        
        res.send(JSON.stringify({islogin:false}));
    }
})




app.get("/allUsers",(req,res)=>{
    const session = req.session.user;

    const query = "SELECT id,username,img FROM users WHERE NOT session = ?"

    db.query(query,[session],(err,data)=>{
        if(err){
            console.log(err);
            res.send(err);
        }

        if(data.length >= 1){
            res.send(data);
        }

    })

})

app.post("/Exist",(req,res)=>{
    const id = req.body.id;

    const query = "SELECT * FROM users WHERE id = ?"

    db.query(query,[id],(err,data)=>{
        if(err){
            console.log(err);
            res.send(err);
        }

        if(data){
            const img = data[0].img;
            const username = data[0].username;
            if(data.length === 1){
                res.send(JSON.stringify({res:"ok",img:img,username:username}));
            }else{
                res.send(JSON.stringify({res:"bad",msg:"User doesn`t exist"}));
            }
        }

    })

})


app.post("/login",(req,res)=>{


   
    const email = req.body.email;
    const password = req.body.password;
   

    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query,[email], async (err,data)=>{
        if(err){
            console.log(err);
            res.send(err);
        }

        if(data.length === 1){

            const hashed = data[0].password;
            const ispass = bcrypt.compareSync(password,hashed);

            if(ispass){
                
                    const session = data[0].session;
                    req.session.user = session;
                    req.session.save((err)=>{
                        if(err){
                            console.log(err);
                        }

                        res.send(JSON.stringify({res:"ok",msg:"logined"}));
                    })


            }else{
                res.send(JSON.stringify({res:"bad",msg:"the Password you Entered is Wrong"}));
            }
            


        }else{
            res.send(JSON.stringify({res:"bad",msg:"the Email you Entered is Wrong"}));
        }

    })


    

})


app.get("/getUser",(req,res)=>{
    const session = req.session.user;

    const query = "SELECT id,username,img,session FROM users WHERE session = ?"

    db.query(query,[session],(err,data)=>{
        if(err){
            console.log(err);
            res.send(err);
        }

        if(data){
            
            if(data.length === 1){
                res.send(data);
            }
       
        }

    })

})



app.post("/signup",(req,res)=>{
    const username = req.body.username.toLowerCase();
    const email = req.body.email;
    const password = req.body.password;
    const imgPath = "imgs/profile.png"
    const session = rand(20);

    const query = "SELECT * FROM users WHERE username = ?";

    db.query(query,[username],(err,data)=>{
        if(err){
            console.log(err);
            res.send(err)
        }

        if(data.length == 1){
            res.send(JSON.stringify({res:"bad",msg:"Username Already exist"}));
        }else{
            const query = "SELECT * FROM users WHERE email = ?";
            db.query(query,[username],(err,data)=>{
                if(err){
                    res.send(err)
                    console.log(err);
                }

                if(data.length == 1){
                    res.send(JSON.stringify({res:"bad",msg:"Email used"}));
                }else{
                    


               

                    bcrypt.hash(password,saltRounds,(err,hash)=>{
                        if(err){
                            console.log(err);
                            res.send(err);
                        }

                        const query = "INSERT INTO users(username,email,password,img,session,date) VALUES (?,?,?,?,?,?)";
                        
                        db.query(query,[username,email,hash,imgPath,session,getFullDate()],(err,data)=>{
                            if(err){
                                console.log(err);
                                res.send(err);
                            }
                            
                            if(data){


                                    req.session.user = session;
                                    req.session.save((err)=>{
                                        if(err){
                                            console.log(err);
                                        }

                                        res.send(JSON.stringify({res:"ok",msg:"profile created"}));
                                    })

                            
                            }


                        })

                    })
                }

            })
        }

    })





})


const getFullDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const fullDate = year + "-" + month + "-" + day

    return fullDate;
}




const rand = (len) =>{
    let res = "";
    const chars = "ABCDEFGPQRS!@#$%^&*abcdef0!@#$%^&*12389ghijkOlm47nopqTUrstuvwxyzHIJKLMNVW56XYZ";

    for (let i = 0; i < len; i++) {
        
        res += chars.charAt(Math.floor(Math.random() * chars.length))
    }


    return res;
}
